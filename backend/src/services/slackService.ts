import axios from 'axios';
import { prisma } from '../config/prisma';

export interface RateLimitAlertData {
  senderEmail: string;
  hourlyLimit: number;
  currentCount: number;
  rescheduledTo: Date;
  jobCountDelayed: number;
}

export async function sendRateLimitSlackAlert(data: RateLimitAlertData, userId?: string): Promise<boolean> {
  try {
    // Find slack setting for this user or first connected slack setting
    let slackSetting = null;
    if (userId) {
      slackSetting = await prisma.slackSetting.findUnique({ where: { userId } });
    }
    if (!slackSetting || !slackSetting.isConnected) {
      slackSetting = await prisma.slackSetting.findFirst({ where: { isConnected: true } });
    }

    if (!slackSetting || !slackSetting.webhookUrl) {
      console.log('ℹ️ No active Slack connection found. Skipping Slack alert.');
      return false;
    }

    const payload = {
      text: `🚨 *ReachInbox Rate Limit Alert*: Sender \`${data.senderEmail}\` hit the hourly threshold!`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '⚠️ Email Sender Rate Limit Exceeded',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Sender:*\n\`${data.senderEmail}\``,
            },
            {
              type: 'mrkdwn',
              text: `*Hourly Limit:*\n${data.hourlyLimit} emails / hr`,
            },
            {
              type: 'mrkdwn',
              text: `*Sent in Current Window:*\n${data.currentCount} emails`,
            },
            {
              type: 'mrkdwn',
              text: `*Rescheduled Next Window:*\n${data.rescheduledTo.toLocaleTimeString()} (${data.jobCountDelayed} queued)`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '🛡️ *Idempotency & Safety*: Jobs have been delayed into the next hour window without data loss or duplicate delivery.',
            },
          ],
        },
      ],
    };

    const response = await axios.post(slackSetting.webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });

    console.log(`✅ Dispatched Slack rate limit notification: HTTP ${response.status}`);
    return true;
  } catch (error: any) {
    console.error('⚠️ Failed to dispatch Slack notification:', error.message);
    return false;
  }
}

export async function sendTestSlackNotification(webhookUrl: string): Promise<boolean> {
  const payload = {
    text: '🎉 ReachInbox Email Scheduler: Slack integration successfully connected!',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⚡ ReachInbox Slack Connected',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Your Slack channel is now connected to receive real-time rate limit alerts and queue monitoring notifications.',
        },
      },
    ],
  };

  const response = await axios.post(webhookUrl, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 5000,
  });

  return response.status === 200;
}
