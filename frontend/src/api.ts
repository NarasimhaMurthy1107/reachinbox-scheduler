import axios from 'axios';
import { EmailJob, Sender, DashboardStats, SlackStatus, User } from './types';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://reachinbox-scheduler-production-7ac2.up.railway.app/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('reachinbox_token');

  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }

  return cfg;
});

export const api = {
  async googleLogin(credential: string): Promise<{ token: string; user: User }> {
    const res = await client.post('/auth/google', { credential });
    return res.data;
  },

  async demoLogin(): Promise<{ token: string; user: User }> {
    const res = await client.post('/auth/demo');
    return res.data;
  },

  async getCurrentUser(): Promise<{ user: User }> {
    const res = await client.get('/auth/me');
    return res.data;
  },

  async scheduleEmails(payload: {
    senderEmail: string;
    senderName?: string;
    recipients: string[];
    subject: string;
    body: string;
    startTime?: string;
    delayBetweenEmailsSeconds?: number;
    hourlyLimit?: number;
  }) {
    const res = await client.post('/emails/schedule', payload);
    return res.data;
  },

  async getScheduledEmails(
    page: number = 1,
    limit: number = 50
  ): Promise<{ emails: EmailJob[]; total: number }> {
    const res = await client.get(
      `/emails/scheduled?page=${page}&limit=${limit}`
    );
    return res.data;
  },

  async getSentEmails(
    page: number = 1,
    limit: number = 50
  ): Promise<{ emails: EmailJob[]; total: number }> {
    const res = await client.get(
      `/emails/sent?page=${page}&limit=${limit}`
    );
    return res.data;
  },

  async searchEmails(
    query: string,
    status?: string
  ): Promise<{ emails: EmailJob[]; total: number; source: string }> {
    const res = await client.get(
      `/emails/search?q=${encodeURIComponent(query)}${
        status ? `&status=${status}` : ''
      }`
    );
    return res.data;
  },

  async cancelEmail(id: string): Promise<{ success: boolean }> {
    const res = await client.delete(`/emails/${id}`);
    return res.data;
  },

  async getStats(): Promise<DashboardStats> {
    const res = await client.get('/emails/stats');
    return res.data;
  },

  async getSenders(): Promise<{ senders: Sender[] }> {
    const res = await client.get('/senders');
    return res.data;
  },

  async getSlackStatus(): Promise<SlackStatus> {
    const res = await client.get('/slack/status');
    return res.data;
  },

  async saveSlackWebhook(
    webhookUrl: string,
    channel?: string
  ): Promise<{ success: boolean }> {
    const res = await client.post('/slack/webhook', {
      webhookUrl,
      channel,
    });
    return res.data;
  },

  async testSlackNotification(): Promise<{
    success: boolean;
    message: string;
  }> {
    const res = await client.post('/slack/test');
    return res.data;
  },

  async disconnectSlack(): Promise<{ success: boolean }> {
    const res = await client.post('/slack/disconnect');
    return res.data;
  },
};