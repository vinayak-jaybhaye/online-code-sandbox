# AGENTS.md — apps/worker

Job consumer that pulls execution jobs from the Redis queue and runs code inside Docker sandbox containers.

## Architecture Rules

1. **`ExecutionEngine` interface** — sandbox execution is abstracted behind an interface in `engines/types.ts`. The `DockerEngine` is one implementation. This allows swapping to Firecracker, gVisor, or remote execution without changing worker logic.
2. **Separation of concerns**:
   - `worker.ts` — main loop, orchestration
   - `queue.ts` — Redis queue consumption (BLPOP)
   - `engines/dockerEngine.ts` — Docker container lifecycle
   - `limits.ts` — timeout and output size enforcement
3. **Always clean up** — use `try/finally` to remove temp files and containers, even on timeout/error.
4. **Import shared types** from `@online-code-sandbox/shared` — never redefine.

## File Map (planned)

| File                          | Purpose                                              |
| ----------------------------- | ---------------------------------------------------- |
| `src/worker.ts`               | Main loop: wait for job → execute → write result     |
| `src/config.ts`               | Env var validation + typed config object             |
| `src/queue.ts`                | `waitForJob()` — BLPOP on Redis queue                |
| `src/engines/types.ts`        | `ExecutionEngine` interface + `ExecutionResult` type |
| `src/engines/dockerEngine.ts` | Docker container execution via `child_process`       |
| `src/limits.ts`               | Timeout + output size enforcement                    |

## Sandbox Security

- `--network none` — no network access
- `--memory=256m` — memory cap
- Non-root user inside container
- Read-only source mount
- Container removed after execution (`--rm`)
