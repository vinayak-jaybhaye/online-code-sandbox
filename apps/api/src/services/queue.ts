import type { ExecutionJob } from '@online-code-sandbox/shared';
import { QUEUE_NAME } from '@online-code-sandbox/shared';
import { redis } from './redisClient.js';

/**
 * Push an execution job onto the Redis queue.
 * The worker consumes jobs from this queue via BLPOP.
 */
export async function enqueueExecution(job: ExecutionJob): Promise<void> {
  await redis.lpush(QUEUE_NAME, JSON.stringify(job));
}
