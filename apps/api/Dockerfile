FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ── Install dependencies ─────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/
# Build shared first — api imports from shared/dist/
RUN pnpm --filter @online-code-sandbox/shared build
RUN pnpm --filter api build

# ── Runtime ───────────────────────────────────────────────────────────────────
# IMPORTANT: Copy node_modules from BUILD stage (not deps), because Docker COPY
# resolves pnpm workspace symlinks. The build stage has packages/shared/dist/
# so the resolved symlink includes the compiled output.
FROM node:22-slim AS runtime
WORKDIR /app

COPY --from=build /app/node_modules node_modules
COPY --from=build /app/packages/shared packages/shared
COPY --from=build /app/apps/api/node_modules apps/api/node_modules
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/package.json apps/api/package.json

EXPOSE 3000
CMD ["node", "apps/api/dist/server.js"]
