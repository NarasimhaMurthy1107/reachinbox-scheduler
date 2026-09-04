import { Worker, Job, DelayedError } from 'bullmq';
import { EMAIL_QUEUE_NAME } from '../queue/emailQueue';
import { redisConnection } from '../config/redis';
import { prisma } from '../config/prisma';
import { getTransporter, getPreviewUrl } from '../config/ethereal';
import { updateEmailInEs } from '../services/elasticsearchService';
import { sendRateLimitSlackAlert } from '../services/slackService';
import { config } from '../config/env';
import { EmailJobData } from '../types';

function getHourKey(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  return `${y}-${m}-${d}-${h}`;
}

export function startEmailWorker() {
  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>, token?: string) => {
      const { jobId, senderEmail, recipientEmail, subject, body, userId } = job.data;
      console.log(`[Worker] 🚀 Processing job ${jobId} -> To: ${recipientEmail} from ${senderEmail}`);

      // 1. Idempotency Check: Verify in DB
      const emailRecord = await prisma.emailJob.findUnique({
        where: { id: jobId },
      });

      if (!emailRecord) {
        console.warn(`[Worker] ⚠️ DB record ${jobId} not found. Skipping.`);
        return;
      }

      if (emailRecord.status === 'SENT') {
        console.log(`[Worker] ⏩ Job ${jobId} already marked SENT in DB. Skipping to prevent duplicate.`);
        return;
      }

      // 2. Fetch Sender's configured hourly limit
      let hourlyLimit = config.maxEmailsPerHourPerSender;
      const sender = await prisma.sender.findUnique({
        where: { email: senderEmail },
      });
      if (sender && sender.hourlyLimit) {
        hourlyLimit = sender.hourlyLimit;
      }

      // 3. Hourly Rate Limit Check via Redis Counter
      const hourKey = getHourKey();
      const rateLimitKey = `ratelimit:hourly:${senderEmail}:${hourKey}`;

      const currentCount = await redisConnection.incr(rateLimitKey);
      if (currentCount === 1) {
        await redisConnection.expire(rateLimitKey, 7200); // 2-hour TTL
      }

      if (currentCount > hourlyLimit) {
        // Rollback the increment since this email won't be sent this hour
        await redisConnection.decr(rateLimitKey);

        const now = new Date();
        const nextHour = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() + 1, 0, 5)
        );
        const delayMs = Math.max(5000, nextHour.getTime() - now.getTime());

        console.warn(
          `[Worker] 🛑 Rate limit exceeded for ${senderEmail} (${hourlyLimit}/hr). Rescheduling job ${jobId} in ${Math.round(delayMs / 1000)}s`
        );

        // Update DB status to RATE_LIMITED
        await prisma.emailJob.update({
          where: { id: jobId },
          data: { status: 'RATE_LIMITED' },
        });

        await updateEmailInEs(jobId, { status: 'RATE_LIMITED' });

        // Trigger Slack Notification (deduplicated to once per hour window)
        const slackAlertKey = `ratelimit:slack_alert:${senderEmail}:${hourKey}`;
        const canAlert = await redisConnection.set(slackAlertKey, 'sent', 'EX', 3600, 'NX');
        if (canAlert) {
          const pendingCount = await prisma.emailJob.count({
            where: { senderEmail, status: { in: ['SCHEDULED', 'RATE_LIMITED'] } },
          });

          await sendRateLimitSlackAlert(
            {
              senderEmail,
              hourlyLimit,
              currentCount: hourlyLimit,
              rescheduledTo: nextHour,
              jobCountDelayed: pendingCount,
            },
            userId
          );
        }

        // BullMQ delayed rescheduling without losing job or failing permanently
        if (token) {
          await job.moveToDelayed(Date.now() + delayMs, token);
          throw new DelayedError();
        } else {
          throw new Error('Worker token unavailable for moveToDelayed');
        }
      }

      // 4. Provider Throttling: Enforce minimum delay between emails for this sender
      const throttleKey = `throttle:${senderEmail}:last_sent`;
      const lastSentTime = await redisConnection.get(throttleKey);
      if (lastSentTime) {
        const elapsed = Date.now() - parseInt(lastSentTime, 10);
        const minDelayMs = config.minDelayBetweenEmailsSeconds * 1000;
        if (elapsed < minDelayMs) {
          const waitMs = minDelayMs - elapsed;
          console.log(`[Worker] ⏳ Provider throttling: waiting ${waitMs}ms before send...`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
      }

      // 5. Update status to PROCESSING
      await prisma.emailJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING' },
      });

      // 6. Send Email via Ethereal SMTP
      try {
        const transporter = await getTransporter();
        const mailOptions = {
          from: `"${sender ? sender.name : senderEmail.split('@')[0]}" <${senderEmail}>`,
          to: recipientEmail,
          subject,
          text: body,
          html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; padding: 20px;">
            <p>${body.replace(/\n/g, '<br/>')}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <small style="color: #888;">Sent via ReachInbox Scheduler Demo</small>
          </div>`,
        };

        const info = await transporter.sendMail(mailOptions);
        const previewUrl = getPreviewUrl(info) || null;

        // Update throttle timestamp
        await redisConnection.set(throttleKey, Date.now().toString(), 'EX', 60);

        const sentAt = new Date();

        // 7. Update PostgreSQL to SENT
        await prisma.emailJob.update({
          where: { id: jobId },
          data: {
            status: 'SENT',
            sentAt,
            etherealUrl: previewUrl,
          },
        });

        // 8. Update Elasticsearch
        await updateEmailInEs(jobId, {
          status: 'SENT',
          sentAt,
          etherealUrl: previewUrl,
        });

        console.log(`[Worker] ✅ Sent email ${jobId} to ${recipientEmail}. Preview URL: ${previewUrl}`);
      } catch (sendErr: any) {
        console.error(`[Worker] ❌ Failed to send email ${jobId}:`, sendErr.message);

        const currentRetries = (emailRecord.retryCount || 0) + 1;
        const isFinalFailure = currentRetries >= (job.opts.attempts || 3);

        await prisma.emailJob.update({
          where: { id: jobId },
          data: {
            retryCount: currentRetries,
            status: isFinalFailure ? 'FAILED' : 'SCHEDULED',
            errorMessage: sendErr.message,
          },
        });

        if (isFinalFailure) {
          await updateEmailInEs(jobId, {
            status: 'FAILED',
          });
        }

        throw sendErr; // BullMQ handles retries with backoff
      }
    },
    {
      connection: redisConnection,
      concurrency: config.workerConcurrency,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    if (err instanceof DelayedError) {
      console.log(`[Worker] Job ${job?.id} rate limited and moved to delayed queue.`);
    } else {
      console.error(`[Worker] Job ${job?.id} failed with error:`, err.message);
    }
  });

  return worker;
}
