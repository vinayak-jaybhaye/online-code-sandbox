# AGENTS.md — apps/web

React frontend with Monaco Editor for code editing, polling-based execution status display.

## Architecture Rules

1. **Components are pure UI** — no fetch calls, no polling logic, no business logic inside components.
2. **`services/executionApi.ts`** — HTTP transport layer. All API calls go through here. When WebSockets are added, this file is the swap point.
3. **`hooks/useExecution.ts`** — state + polling logic. When streaming is added, replace polling with WebSocket subscription here. Components don't change.
4. **Import shared types** from `@online-code-sandbox/shared` — never redefine status strings or types.
5. **Design system** in `index.css` — use CSS custom properties (e.g., `var(--color-accent)`). Don't hardcode colors or spacing in component styles.

## File Map (planned)

| File                                  | Purpose                                       |
| ------------------------------------- | --------------------------------------------- |
| `src/App.tsx`                         | Root layout, composes components              |
| `src/components/CodeEditor.tsx`       | Monaco Editor wrapper                         |
| `src/components/LanguageSelector.tsx` | Language dropdown                             |
| `src/components/RunButton.tsx`        | Run/cancel button with loading state          |
| `src/components/OutputPanel.tsx`      | Execution output + status display             |
| `src/services/executionApi.ts`        | HTTP API client (swap point for WS)           |
| `src/hooks/useExecution.ts`           | Execution state + polling (swap point for WS) |
| `src/index.css`                       | Design system (CSS custom properties)         |

## Streaming Upgrade Path

When output streaming is added:

1. Add WebSocket connection logic in `services/executionApi.ts`
2. Replace polling with subscription in `hooks/useExecution.ts`
3. `OutputPanel.tsx` already renders from a growing output string — no changes needed
4. Components remain unchanged
