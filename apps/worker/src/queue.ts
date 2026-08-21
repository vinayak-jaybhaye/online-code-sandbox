import Redis from 'ioredis';
import { QUEUE_NAME } from '@online-code-sandbox/shared';
import type { ExecutionJob } from '@online-code-sandbox/shared';
import { config } from './config.js';

/**
 * Separate Redis client for blocking queue operations.
 * BLPOP blocks the connection, so we need a dedicated client
 * (the worker also uses a regular client for state updates).
 */
const blockingClient = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null, // Required for blocking commands
});

blockingClient.on('error', (err) => {
  console.error('[Queue] Redis error:', err.message);
});

/**
 * Block until a job is available on the execution queue.
 * Returns the parsed ExecutionJob, or null if the wait was interrupted.
 */
export async function waitForJob(): Promise<ExecutionJob | null> {
  // BLPOP blocks until an item is available (0 = block indefinitely)
  const result = await blockingClient.blpop(QUEUE_NAME, 0);
  if (!result) return null;

  // result is [key, value]
  const [, rawJob] = result;
  return JSON.parse(rawJob) as ExecutionJob;
}

/** Gracefully close the blocking Redis client. */
export async function shutdownQueue(): Promise<void> {
  await blockingClient.quit();
}
