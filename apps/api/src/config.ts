/**
 * API configuration — validates and exports typed env vars.
 * Fails fast at import time if required variables are missing.
 */

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer, got: "${raw}"`);
  }
  return parsed;
}

export const config = {
  port: envInt('API_PORT', 3000),
  redisUrl: env('REDIS_URL', 'redis://localhost:6379'),
  executionTimeoutMs: envInt('EXECUTION_TIMEOUT_MS', 10_000),
  maxOutputBytes: envInt('MAX_OUTPUT_BYTES', 102_400),
} as const;
