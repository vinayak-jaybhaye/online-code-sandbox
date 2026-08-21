import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { executionsRouter } from './routes/executions.js';
import { errorHandler } from './middleware/errorHandler.js';
import { shutdownRedis } from './services/redisClient.js';

const app = express();

// ── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ── Routes ──────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/executions', executionsRouter);

// ── Error handler (must be registered last) ─────────────────────────────────

app.use(errorHandler);

// ── Start server ────────────────────────────────────────────────────────────

const server = app.listen(config.port, () => {
  console.log(`[API] Server listening on http://localhost:${config.port}`);
});

// ── Graceful shutdown ───────────────────────────────────────────────────────

async function shutdown(signal: string) {
  console.log(`\n[API] ${signal} received — shutting down...`);
  server.close();
  await shutdownRedis();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
