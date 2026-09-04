import { Request, Response } from 'express';
import axios from 'axios';
import { prisma } from '../config/prisma';
import { config } from '../config/env';
import { sendTestSlackNotification } from '../services/slackService';
import { AuthRequest } from '../middlewares/auth';

export async function getSlackStatus(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    let slack = null;
    if (userId) {
      slack = await prisma.slackSetting.findUnique({ where: { userId } });
    }
    if (!slack) {
      slack = await prisma.slackSetting.findFirst({ where: { isConnected: true } });
    }

    return res.json({
      isConnected: slack ? slack.isConnected : false,
      channel: slack?.channel || 'Default Alert Channel',
      webhookConfigured: !!slack?.webhookUrl,
      updatedAt: slack?.updatedAt,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function saveWebhook(req: AuthRequest, res: Response) {
  try {
    const { webhookUrl, channel } = req.body;
    const userId = req.user?.id;

    if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
      return res.status(400).json({ error: 'Please enter a valid Slack webhook URL (https://hooks.slack.com/...)' });
    }

    const slackSetting = await prisma.slackSetting.upsert({
      where: { userId: userId || 'default' },
      update: {
        webhookUrl,
        channel: channel || '#email-alerts',
        isConnected: true,
      },
      create: {
        userId: userId || 'default',
        webhookUrl,
        channel: channel || '#email-alerts',
        isConnected: true,
      },
    });

    return res.json({ success: true, slackSetting });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function disconnectSlack(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    await prisma.slackSetting.updateMany({
      where: userId ? { userId } : { isConnected: true },
      data: { isConnected: false },
    });

    return res.json({ success: true, message: 'Slack disconnected' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function testSlack(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    let slack = null;
    if (userId) {
      slack = await prisma.slackSetting.findUnique({ where: { userId } });
    }
    if (!slack || !slack.webhookUrl) {
      slack = await prisma.slackSetting.findFirst({ where: { isConnected: true } });
    }

    if (!slack || !slack.webhookUrl) {
      return res.status(400).json({ error: 'Slack is not connected yet. Please provide a webhook URL first.' });
    }

    const success = await sendTestSlackNotification(slack.webhookUrl);
    if (success) {
      return res.json({ success: true, message: 'Test message sent to Slack successfully!' });
    } else {
      return res.status(500).json({ error: 'Failed to send message to Slack. Check the webhook URL.' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getSlackOAuthUrl(req: Request, res: Response) {
  if (!config.slack.clientId) {
    return res.status(400).json({ error: 'Slack OAuth is not configured in .env' });
  }

  const scopes = ['incoming-webhook', 'chat:write'].join(',');
  const url = `https://slack.com/oauth/v2/authorize?client_id=${config.slack.clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(
    config.slack.redirectUri
  )}`;

  return res.json({ url });
}

export async function slackOAuthCallback(req: Request, res: Response) {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${config.frontendUrl}?slack_error=missing_code`);
    }

    const tokenResponse = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      new URLSearchParams({
        client_id: config.slack.clientId,
        client_secret: config.slack.clientSecret,
        code: code as string,
        redirect_uri: config.slack.redirectUri,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const data = tokenResponse.data;
    if (!data.ok) {
      return res.redirect(`${config.frontendUrl}?slack_error=${encodeURIComponent(data.error || 'oauth_failed')}`);
    }

    const webhookUrl = data.incoming_webhook?.url;
    const channel = data.incoming_webhook?.channel;
    const accessToken = data.access_token;

    await prisma.slackSetting.upsert({
      where: { userId: 'default' },
      update: {
        webhookUrl: webhookUrl || null,
        channel: channel || null,
        accessToken: accessToken || null,
        isConnected: true,
      },
      create: {
        userId: 'default',
        webhookUrl: webhookUrl || null,
        channel: channel || null,
        accessToken: accessToken || null,
        isConnected: true,
      },
    });

    return res.redirect(`${config.frontendUrl}?slack_connected=true`);
  } catch (error: any) {
    return res.redirect(`${config.frontendUrl}?slack_error=${encodeURIComponent(error.message)}`);
  }
}
