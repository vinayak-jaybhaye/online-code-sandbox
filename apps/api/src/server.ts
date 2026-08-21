/**
 * API Server — placeholder entry point.
 * Full implementation will be added in Phase 3.
 */

// Validate required environment variables at startup
const requiredEnvVars = ['REDIS_URL'] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} is not set. Using defaults for development.`);
  }
}

console.log('API server placeholder — ready for implementation.');
