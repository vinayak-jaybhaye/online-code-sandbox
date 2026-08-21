/**
 * Redis key patterns — centralized so API and Worker use identical key formats.
 * All Redis key logic must go through these helpers.
 */

/** Redis key for storing execution state. */
export function executionKey(executionId: string): string {
  return `execution:${executionId}`;
}

/** Redis list name for the execution job queue. */
export const QUEUE_NAME = 'execution:queue';

/** Default TTL for execution state keys (in seconds). */
export const EXECUTION_TTL_SECONDS = 600; // 10 minutes
