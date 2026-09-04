import { Queue, JobsOptions } from 'bullmq';
import { redisConnection } from '../config/redis';
import { EmailJobData } from '../types';

export const EMAIL_QUEUE_NAME = 'email-queue';

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 10000, // Keep last 10k completed jobs for monitoring
    },
    removeOnFail: {
      count: 10000,
    },
  },
});

export async function scheduleEmailJob(
  jobData: EmailJobData,
  delayMs: number = 0
) {
  const opts: JobsOptions = {
    jobId: jobData.jobId, // STRICT IDEMPOTENCY: DB record UUID = BullMQ JobId
  };

  if (delayMs > 0) {
    opts.delay = delayMs;
  }

  return await emailQueue.add('send-email', jobData, opts);
}

export async function scheduleBatchEmailJobs(
  jobs: EmailJobData[],
  delayBetweenSeconds: number = 2,
  baseDelayMs: number = 0
) {
  const addedJobs = [];

  for (let i = 0; i < jobs.length; i++) {
    const jobData = jobs[i];
    const delay = Math.max(0, baseDelayMs + i * delayBetweenSeconds * 1000);
    const job = await scheduleEmailJob(jobData, delay);
    addedJobs.push(job);
  }

  return addedJobs;
}

export async function cancelJob(jobId: string): Promise<boolean> {
  try {
    const job = await emailQueue.getJob(jobId);
    if (job) {
      await job.remove();
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}
