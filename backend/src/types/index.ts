export interface ScheduleEmailPayload {
  senderEmail: string;
  senderName?: string;
  recipients: string[];
  subject: string;
  body: string;
  startTime?: string; // ISO string or undefined (for immediate)
  delayBetweenEmailsSeconds?: number;
  hourlyLimit?: number;
}

export interface EmailJobData {
  jobId: string; // matches DB EmailJob.id
  userId?: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  batchId?: string;
  scheduledAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}
