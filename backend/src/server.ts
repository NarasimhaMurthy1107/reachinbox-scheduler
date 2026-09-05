import express from 'express';
import cors from 'cors';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { config } from './config/env';
import { emailQueue } from './queue/emailQueue';
import { startEmailWorker } from './workers/emailWorker';
import apiRouter from './routes/api';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// BullMQ Dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue as any) as any],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// API Routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root route - useful for Railway/browser testing
app.get('/', (req, res) => {
  res.json({
    message: 'ReachInbox Email Scheduler API',
    status: 'running',
    health: '/health',
  });
});

// Start Server + Worker
async function bootstrap() {
  try {
    console.log('🚀 Initializing ReachInbox Email Scheduler backend...');

    // Start BullMQ worker
    const worker = startEmailWorker();

    console.log(
      `✅ BullMQ Worker started with concurrency: ${config.workerConcurrency}`
    );

    // Start Express server
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${config.port}`);
      console.log(
        `📊 BullMQ dashboard: /admin/queues`
      );
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(
        `\n🛑 Received ${signal}. Gracefully shutting down...`
      );

      await worker.close();
      await emailQueue.close();

      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();