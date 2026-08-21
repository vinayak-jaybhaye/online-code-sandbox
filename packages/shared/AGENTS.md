# AGENTS.md — packages/shared

This is the **single source of truth** for types, enums, and utilities shared across `api`, `worker`, and `web`.

## Rules

1. **Never duplicate types or enums** defined here into other packages. Always import from `@online-code-sandbox/shared`.
2. **Barrel export** everything through `src/index.ts`. Consumers should only import from the package root.
3. **No runtime dependencies** — this package has zero runtime deps. Keep it that way.
4. **Use `as const` + type extraction** for enums (see `executionStatus.ts`). Do not use TypeScript `enum` keyword.
5. **Event types in `types/events.ts`** are for future streaming. Do not remove them — they are intentionally pre-defined.

## File Map

| File                     | Purpose                                                           |
| ------------------------ | ----------------------------------------------------------------- |
| `src/executionStatus.ts` | Status enum, terminal status set, `isTerminalStatus()` helper     |
| `src/redisKeys.ts`       | Redis key patterns (`executionKey()`, `QUEUE_NAME`, TTL constant) |
| `src/validation.ts`      | Request validation (`validateExecutionRequest()`)                 |
| `src/types/execution.ts` | Core types: `ExecutionState`, `ExecutionJob`, `ExecutionRequest`  |
| `src/types/events.ts`    | Future streaming event contracts (not used in polling phase)      |
| `src/index.ts`           | Barrel export                                                     |
