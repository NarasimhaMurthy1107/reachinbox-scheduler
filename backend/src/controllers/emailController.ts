import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/prisma';
import { scheduleBatchEmailJobs, cancelJob } from '../queue/emailQueue';
import { indexEmail, searchEmails } from '../services/elasticsearchService';
import { config } from '../config/env';
import { AuthRequest } from '../middlewares/auth';
import { EmailJobData } from '../types';

export async function scheduleEmails(req: AuthRequest, res: Response) {
  try {
    const {
      senderEmail,
      senderName,
      recipients,
      subject,
      body,
      startTime,
      delayBetweenEmailsSeconds = config.minDelayBetweenEmailsSeconds,
      hourlyLimit = config.maxEmailsPerHourPerSender,
    } = req.body;

    if (!senderEmail || !subject || !body || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: senderEmail, recipients (array), subject, body are required.',
      });
    }

    // Clean & validate recipient email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validRecipients = Array.from(
      new Set(
        recipients
          .map((r: string) => r.trim().toLowerCase())
          .filter((r: string) => emailRegex.test(r))
      )
    );

    if (validRecipients.length === 0) {
      return res.status(400).json({ error: 'No valid recipient email addresses found.' });
    }

    // Upsert Sender
    const sender = await prisma.sender.upsert({
      where: { email: senderEmail },
      update: {
        name: senderName || senderEmail.split('@')[0],
        hourlyLimit: parseInt(hourlyLimit, 10) || config.maxEmailsPerHourPerSender,
      },
      create: {
        email: senderEmail,
        name: senderName || senderEmail.split('@')[0],
        hourlyLimit: parseInt(hourlyLimit, 10) || config.maxEmailsPerHourPerSender,
      },
    });

    const batchId = uuidv4();
    const parsedStartTime = startTime ? new Date(startTime) : new Date();
    const nowTime = Date.now();
    const baseDelayMs = Math.max(0, parsedStartTime.getTime() - nowTime);
    const delayStepSeconds = Math.max(1, parseInt(delayBetweenEmailsSeconds, 10) || 2);

    const emailRecordsToInsert = [];
    const queueJobs: EmailJobData[] = [];

    for (let i = 0; i < validRecipients.length; i++) {
      const recipient = validRecipients[i];
      const jobId = uuidv4();
      const scheduledAt = new Date(parsedStartTime.getTime() + i * delayStepSeconds * 1000);

      emailRecordsToInsert.push({
        id: jobId,
        userId: req.user?.id || null,
        senderId: sender.id,
        senderEmail: sender.email,
        recipientEmail: recipient,
        subject,
        body,
        status: 'SCHEDULED',
        scheduledAt,
        batchId,
      });

      queueJobs.push({
        jobId,
        userId: req.user?.id,
        senderEmail: sender.email,
        recipientEmail: recipient,
        subject,
        body,
        batchId,
        scheduledAt: scheduledAt.toISOString(),
      });
    }

    // 1. Bulk persist in PostgreSQL
    await prisma.emailJob.createMany({
      data: emailRecordsToInsert,
    });

    // 2. Schedule in BullMQ with staggered delays
    await scheduleBatchEmailJobs(queueJobs, delayStepSeconds, baseDelayMs);

    // 3. Index each scheduled email into Elasticsearch for immediate searchability
    for (const record of emailRecordsToInsert) {
      indexEmail({
        id: record.id,
        userId: record.userId,
        senderEmail: record.senderEmail,
        recipientEmail: record.recipientEmail,
        subject: record.subject,
        body: record.body,
        status: record.status,
        scheduledAt: record.scheduledAt,
        batchId: record.batchId,
        createdAt: new Date(),
      }).catch((e) => console.warn('ES async index err:', e.message));
    }

    return res.status(201).json({
      success: true,
      batchId,
      totalScheduled: validRecipients.length,
      firstScheduledAt: emailRecordsToInsert[0].scheduledAt,
      lastScheduledAt: emailRecordsToInsert[emailRecordsToInsert.length - 1].scheduledAt,
      delayBetweenEmailsSeconds: delayStepSeconds,
      hourlyLimit: sender.hourlyLimit,
    });
  } catch (error: any) {
    console.error('Schedule emails error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getScheduledEmails(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const skip = (page - 1) * limit;

    const [emails, total] = await Promise.all([
      prisma.emailJob.findMany({
        where: {
          status: { in: ['SCHEDULED', 'PROCESSING', 'RATE_LIMITED'] },
        },
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.emailJob.count({
        where: {
          status: { in: ['SCHEDULED', 'PROCESSING', 'RATE_LIMITED'] },
        },
      }),
    ]);

    return res.json({
      emails,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getSentEmails(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const skip = (page - 1) * limit;

    const [emails, total] = await Promise.all([
      prisma.emailJob.findMany({
        where: {
          status: { in: ['SENT', 'FAILED'] },
        },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.emailJob.count({
        where: {
          status: { in: ['SENT', 'FAILED'] },
        },
      }),
    ]);

    return res.json({
      emails,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function searchEmailsHandler(req: AuthRequest, res: Response) {
  try {
    const queryStr = (req.query.q as string) || '';
    const status = (req.query.status as string) || undefined;
    const sender = (req.query.sender as string) || undefined;

    // 1. Try Elasticsearch first (as per requirements)
    const esResult = await searchEmails(queryStr, status, sender);
    if (esResult) {
      return res.json({
        source: 'elasticsearch',
        total: esResult.total,
        emails: esResult.emails,
      });
    }

    // 2. Fallback to PostgreSQL if ES is unreachable
    console.log('Falling back to database search...');
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (sender) whereClause.senderEmail = sender;
    if (queryStr) {
      whereClause.OR = [
        { subject: { contains: queryStr, mode: 'insensitive' } },
        { recipientEmail: { contains: queryStr, mode: 'insensitive' } },
        { body: { contains: queryStr, mode: 'insensitive' } },
      ];
    }

    const emails = await prisma.emailJob.findMany({
      where: whereClause,
      orderBy: { scheduledAt: 'desc' },
      take: 100,
    });

    return res.json({
      source: 'database_fallback',
      total: emails.length,
      emails,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function cancelEmail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const email = await prisma.emailJob.findUnique({ where: { id } });
    if (!email) {
      return res.status(404).json({ error: 'Email job not found' });
    }

    if (email.status === 'SENT') {
      return res.status(400).json({ error: 'Email has already been sent and cannot be canceled' });
    }

    // Remove from BullMQ queue
    await cancelJob(id);

    // Delete or mark canceled in DB
    await prisma.emailJob.delete({ where: { id } });

    return res.json({ success: true, message: 'Email scheduled job canceled successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    const [scheduledCount, sentCount, rateLimitedCount, failedCount, totalSenders] = await Promise.all([
      prisma.emailJob.count({ where: { status: 'SCHEDULED' } }),
      prisma.emailJob.count({ where: { status: 'SENT' } }),
      prisma.emailJob.count({ where: { status: 'RATE_LIMITED' } }),
      prisma.emailJob.count({ where: { status: 'FAILED' } }),
      prisma.sender.count(),
    ]);

    return res.json({
      scheduledCount,
      sentCount,
      rateLimitedCount,
      failedCount,
      totalSenders,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getSenders(req: AuthRequest, res: Response) {
  try {
    const senders = await prisma.sender.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ senders });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
