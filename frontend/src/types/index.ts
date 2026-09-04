export interface EmailJob {
  id: string;
  userId?: string | null;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'RATE_LIMITED';
  scheduledAt: string;
  sentAt?: string | null;
  etherealUrl?: string | null;
  errorMessage?: string | null;
  retryCount: number;
  batchId?: string | null;
  createdAt: string;
  updatedAt?: string;
  highlight?: {
    subject?: string[];
    body?: string[];
    recipientEmail?: string[];
  };
}

export interface Sender {
  id: string;
  email: string;
  name: string;
  hourlyLimit: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface DashboardStats {
  scheduledCount: number;
  sentCount: number;
  rateLimitedCount: number;
  failedCount: number;
  totalSenders: number;
}

export interface SlackStatus {
  isConnected: boolean;
  channel: string;
  webhookConfigured: boolean;
  updatedAt?: string;
}
