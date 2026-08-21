# AGENTS.md — Online Code Sandbox

This file contains project conventions, architectural boundaries, and rules that AI agents **must** follow when modifying this codebase.

## Project Overview

A polling-based online code execution platform. Users submit Python code via a React frontend; it's queued in Redis, executed by a worker in a Docker sandbox, and results are polled back. Designed for future upgrade to WebSocket streaming and bidirectional stdin pipeline without architectural rewrite.

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Language**: TypeScript (strict mode) everywhere
- **Frontend**: React + Vite + Monaco Editor (`apps/web`)
- **API**: Node.js + Express (`apps/api`)
- **Worker**: Node.js (`apps/worker`)
- **Queue + State**: Redis via `ioredis` — no SQL/NoSQL database
- **Sandbox**: Docker containers (Python 3.11-slim)
- **Local Dev**: Docker Compose

## Monorepo Structure

```
apps/api/        → Express REST API server
apps/worker/     → Job consumer that runs code in Docker sandboxes
apps/web/        → React frontend (Vite)
packages/shared/ → Types, enums, validation shared by api + worker + web
docker/          → Sandbox Dockerfiles
infrastructure/  → Terraform, Ansible, Jenkins (IaC)
```

## Architectural Rules

### 1. Single Source of Truth

- **Execution statuses** live ONLY in `packages/shared/src/executionStatus.ts`. Never duplicate status strings.
- **Redis key patterns** live ONLY in `packages/shared/src/redisKeys.ts`. Never hardcode Redis keys.
- **Shared types** live in `packages/shared/src/types/`. Import them — don't redefine.

### 2. Separation of Concerns

- **API route handlers** are thin HTTP adapters. Business logic lives in `services/executionService.ts`.
- **Worker** uses the `ExecutionEngine` interface. Sandbox execution is in `engines/`, not in `worker.ts`.
- **Frontend** keeps networking in `services/executionApi.ts` and state/polling in `hooks/useExecution.ts`. Components are pure UI.

### 3. No Database

- All execution state is stored in Redis with a TTL. This is intentional — do not add a SQL/NoSQL database.

### 4. Decoupling for Streaming

- The API's `executionService.ts` is transport-agnostic. When WebSockets are added, the WS handler calls the same service — no logic duplication.
- The frontend's `useExecution.ts` hook is the only place that knows about polling. Swapping to WebSocket subscription only touches this hook and `executionApi.ts`.
- Event contracts for streaming are pre-defined in `packages/shared/src/types/events.ts`.

### 5. Docker Sandbox Security

- Containers run with `--network none`, `--memory=256m`, non-root user.
- `/var/run/docker.sock` mounting is local-dev-only. Document this explicitly.

## Development Workflow

```bash
pnpm install          # Install all dependencies
pnpm check            # Run lint + format:check + typecheck (all at once)
pnpm lint             # ESLint
pnpm format           # Prettier auto-fix
pnpm format:check     # Prettier check only
pnpm typecheck        # TypeScript check across all packages
pnpm dev:api          # Start API dev server
pnpm dev:worker       # Start worker dev process
pnpm dev:web          # Start Vite dev server
pnpm docker:up        # Start full stack via Docker Compose
pnpm docker:down      # Stop Docker Compose
```

## Code Quality Rules

1. **TypeScript strict mode** — no `any` unless unavoidable (use `unknown` + narrowing).
2. **Use `import type`** for type-only imports (enforced by ESLint `consistent-type-imports`).
3. **No unused variables** — prefix unused params with `_` (e.g., `_req`).
4. **Run `pnpm check`** before committing. All three checks must pass.
5. **Keep files small** — under 200 lines. Split if larger.
6. **Use explicit error handling** — no swallowed errors, no unhandled promise rejections.

## Env Vars

All required env vars are listed in `.env.example`. Both `api` and `worker` validate required vars at startup and fail fast if missing.

## Adding a New Language

1. Add the language name to `SUPPORTED_LANGUAGES` in `packages/shared/src/validation.ts`.
2. Create a new sandbox Dockerfile in `docker/sandbox/<language>/`.
3. Add language-specific execution logic in `apps/worker/src/engines/`.
4. Add language option in `apps/web/src/components/LanguageSelector.tsx`.

## Known Limitations (Intentional)

- **No WebSocket streaming yet** — polling only. Architecture is ready for additive upgrade.
- **Single worker** — no consumer groups. Upgrade to Redis Streams when scaling.
- **Docker socket mount** — local dev only. Production needs dedicated container runtime security.
- **Cancel** — marks status in Redis but may not kill a running container mid-execution.
