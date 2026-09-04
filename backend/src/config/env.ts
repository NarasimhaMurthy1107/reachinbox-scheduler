import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/reachinbox_scheduler?schema=public',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  elasticsearchNode: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  jwtSecret: process.env.JWT_SECRET || 'reachinbox_super_secret_jwt_key_2026',
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  minDelayBetweenEmailsSeconds: parseInt(process.env.MIN_DELAY_BETWEEN_EMAILS_SECONDS || '2', 10),
  maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || '200', 10),
  maxEmailsPerHourPerSender: parseInt(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '50', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  slack: {
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    redirectUri: process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/slack/oauth_callback',
  }
};
