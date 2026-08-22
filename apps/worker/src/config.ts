/**
 * Worker configuration — validates and exports typed env vars.
 * Fails fast at import time if required variables are missing.
 */

function env(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function envInt(name: string): number {
  const raw = process.env[name];
  if (!raw) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer, got: "${raw}"`);
  }
  return parsed;
}

export const config = {
  redisUrl: env('REDIS_URL'),
  executionTimeoutMs: envInt('EXECUTION_TIMEOUT_MS'),
  maxOutputBytes: envInt('MAX_OUTPUT_BYTES'),
} as const;
