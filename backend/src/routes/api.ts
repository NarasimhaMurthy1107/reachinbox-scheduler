import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { googleLogin, demoLogin, getCurrentUser } from '../controllers/authController';
import {
  scheduleEmails,
  getScheduledEmails,
  getSentEmails,
  searchEmailsHandler,
  cancelEmail,
  getDashboardStats,
  getSenders,
} from '../controllers/emailController';
import {
  getSlackStatus,
  saveWebhook,
  disconnectSlack,
  testSlack,
  getSlackOAuthUrl,
  slackOAuthCallback,
} from '../controllers/slackController';

const router = Router();

// Auth routes
router.post('/auth/google', googleLogin);
router.post('/auth/demo', demoLogin);
router.get('/auth/me', authMiddleware, getCurrentUser);

// Email routes
router.post('/emails/schedule', authMiddleware, scheduleEmails);
router.get('/emails/scheduled', authMiddleware, getScheduledEmails);
router.get('/emails/sent', authMiddleware, getSentEmails);
router.get('/emails/search', authMiddleware, searchEmailsHandler);
router.delete('/emails/:id', authMiddleware, cancelEmail);
router.get('/emails/stats', authMiddleware, getDashboardStats);
router.get('/senders', authMiddleware, getSenders);

// Slack routes
router.get('/slack/status', authMiddleware, getSlackStatus);
router.post('/slack/webhook', authMiddleware, saveWebhook);
router.post('/slack/disconnect', authMiddleware, disconnectSlack);
router.post('/slack/test', authMiddleware, testSlack);
router.get('/slack/oauth_url', getSlackOAuthUrl);
router.get('/slack/oauth_callback', slackOAuthCallback);

export default router;
