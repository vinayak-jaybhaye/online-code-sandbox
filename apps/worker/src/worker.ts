import Redis from 'ioredis';
import {
  ExecutionStatus,
  executionKey,
  EXECUTION_TTL_SECONDS,
  isTerminalStatus,
} from '@online-code-sandbox/shared';
import type { ExecutionState, ExecutionJob } from '@online-code-sandbox/shared';
import { config } from './config.js';
import { waitForJob, shutdownQueue } from './queue.js';
import { DockerEngine } from './engines/dockerEngine.js';
import type { ExecutionEngine } from './engines/types.js';

/**
 * Worker main loop.
 *
 * 1. Blocks on Redis queue for the next job
 * 2. Checks if cancelled before starting
 * 3. Updates status to RUNNING
 * 4. Executes code via the ExecutionEngine
 * 5. Writes final result back to Redis
 */

// ── Redis client for state updates (non-blocking) ───────────────────────────

const redis = new Redis(config.redisUrl);

redis.on('error', (err) => {
  console.error('[Worker] Redis error:', err.message);
});

// ── Engine ──────────────────────────────────────────────────────────────────

const engine: ExecutionEngine = new DockerEngine();

// ── State helpers ───────────────────────────────────────────────────────────

async function getState(executionId: string): Promise<ExecutionState | null> {
  const data = await redis.get(executionKey(executionId));
  return data ? (JSON.parse(data) as ExecutionState) : null;
}

async function updateState(state: ExecutionState): Promise<void> {
  const key = executionKey(state.executionId);
  const ttl = await redis.ttl(key);
  await redis.set(key, JSON.stringify(state), 'EX', ttl > 0 ? ttl : EXECUTION_TTL_SECONDS);
}

// ── Job processor ───────────────────────────────────────────────────────────

async function processJob(job: ExecutionJob): Promise<void> {
  const { executionId, language, source } = job;
  console.log(`[Worker] Processing job ${executionId} (${language})`);

  // Check if already cancelled before starting
  const state = await getState(executionId);
  if (!state) {
    console.log(`[Worker] Job ${executionId} — state not found (expired?), skipping.`);
    return;
  }
  if (isTerminalStatus(state.status)) {
    console.log(`[Worker] Job ${executionId} — already ${state.status}, skipping.`);
    return;
  }

  // Mark as RUNNING
  state.status = ExecutionStatus.RUNNING;
  state.startedAt = new Date().toISOString();
  await updateState(state);

  // Execute
  try {
    const result = await engine.execute({
      executionId,
      language,
      source,
      timeoutMs: config.executionTimeoutMs,
      maxOutputBytes: config.maxOutputBytes,
    });

    // Determine final status
    if (result.timedOut) {
      state.status = ExecutionStatus.TIMEOUT;
    } else if (result.outputTruncated) {
      state.status = ExecutionStatus.OUTPUT_LIMIT;
    } else if (result.exitCode !== 0) {
      state.status = ExecutionStatus.RUNTIME_ERROR;
    } else {
      state.status = ExecutionStatus.COMPLETED;
    }

    state.output = result.stdout;
    state.exitCode = result.exitCode;
    state.error = result.stderr || null;
  } catch (err) {
    state.status = ExecutionStatus.RUNTIME_ERROR;
    state.error = err instanceof Error ? err.message : 'Unknown execution error';
    state.exitCode = -1;
  }

  state.completedAt = new Date().toISOString();
  await updateState(state);

  console.log(`[Worker] Job ${executionId} — ${state.status}`);
}

// ── Main loop ───────────────────────────────────────────────────────────────

let running = true;

async function main(): Promise<void> {
  console.log('[Worker] Starting — waiting for jobs...');

  while (running) {
    try {
      const job = await waitForJob();
      if (!job) continue;
      await processJob(job);
    } catch (err) {
      if (!running) break; // Shutdown in progress
      console.error('[Worker] Error processing job:', err);
      // Brief pause before retrying to avoid tight error loops
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// ── Graceful shutdown ───────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  console.log(`\n[Worker] ${signal} received — shutting down...`);
  running = false;
  await shutdownQueue();
  await redis.quit();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

// Start
main().catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
