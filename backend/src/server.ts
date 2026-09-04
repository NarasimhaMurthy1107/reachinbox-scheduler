import express from 'express';
import cors from 'cors';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { config } from './config/env';
import { emailQueue } from './queue/emailQueue';
import { startEmailWorker } from './workers/emailWorker';
import { initElasticsearch } from './config/elasticsearch';
import apiRouter from './routes/api';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Bull-Board Queue Dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue as any) as any],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Start Server, Worker, and Init Elasticsearch
async function bootstrap() {
  try {
    console.log('🚀 Initializing ReachInbox Email Scheduler backend...');

    // 1. Initialize Elasticsearch index
    await initElasticsearch();

    // 2. Start BullMQ background worker
    const worker = startEmailWorker();
    console.log(`✅ BullMQ Worker started with concurrency: ${config.workerConcurrency}`);

    // 3. Start Express server
    app.listen(config.port, () => {
      console.log(`✅ Server running on http://localhost:${config.port}`);
      console.log(`📊 BullMQ Live Dashboard accessible at: http://localhost:${config.port}/admin/queues`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
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
