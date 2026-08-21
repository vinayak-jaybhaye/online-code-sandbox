import { Redis } from 'ioredis';
import { config } from '../config.js';

/**
 * Singleton Redis client for the API server.
 * All Redis operations in the API go through this client.
 */
export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
});

redis.on('error', (err: Error) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('connect', () => {
  console.log('[Redis] Connected to', config.redisUrl);
});

/** Gracefully close the Redis connection. */
export async function shutdownRedis(): Promise<void> {
  await redis.quit();
  console.log('[Redis] Connection closed.');
}
