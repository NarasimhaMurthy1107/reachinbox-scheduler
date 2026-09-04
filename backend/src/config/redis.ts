import Redis from 'ioredis';
import { config } from './env';

export const redisConnection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisConnection.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});
