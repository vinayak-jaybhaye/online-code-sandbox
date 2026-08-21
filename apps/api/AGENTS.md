# AGENTS.md — apps/api

Express REST API that receives code submissions, stores state in Redis, and enqueues jobs for the worker.

## Architecture Rules

1. **Route handlers are thin** — they parse HTTP requests, call `executionService`, and format HTTP responses. No business logic in routes.
2. **`executionService.ts` is transport-agnostic** — it knows nothing about Express `req`/`res`. When WebSockets are added, the WS handler calls the same service methods.
3. **Redis is the only data store** — no SQL/NoSQL. All execution state has a TTL.
4. **Import shared types** from `@online-code-sandbox/shared` — never redefine.

## File Map (planned)

| File                               | Purpose                                                |
| ---------------------------------- | ------------------------------------------------------ |
| `src/server.ts`                    | Express app setup, middleware, route mounting, startup |
| `src/config.ts`                    | Env var validation + typed config object               |
| `src/routes/executions.ts`         | HTTP handlers for `/api/executions` endpoints          |
| `src/services/executionService.ts` | Business logic: create, get, cancel executions         |
| `src/services/redisClient.ts`      | Singleton Redis client, graceful shutdown              |
| `src/services/queue.ts`            | `enqueueExecution()` — push jobs to Redis queue        |
| `src/middleware/errorHandler.ts`   | Global Express error handler                           |

## API Endpoints

- `POST /api/executions` — submit code for execution
- `GET /api/executions/:executionId` — poll execution state
- `POST /api/executions/:executionId/cancel` — request cancellation
