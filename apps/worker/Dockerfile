FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ── Install dependencies ─────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/worker/package.json apps/worker/
RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY apps/worker/ apps/worker/
# Build shared first — worker imports from shared/dist/
RUN pnpm --filter @online-code-sandbox/shared build
RUN pnpm --filter worker build

# ── Runtime ───────────────────────────────────────────────────────────────────
# Worker needs Docker CLI to spawn sandbox containers
FROM node:22-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    docker.io \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# IMPORTANT: Copy from BUILD stage so pnpm symlinks resolve with shared/dist/
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/packages/shared packages/shared
COPY --from=build /app/apps/worker/node_modules apps/worker/node_modules
COPY --from=build /app/apps/worker/dist apps/worker/dist
COPY --from=build /app/apps/worker/package.json apps/worker/package.json

CMD ["node", "apps/worker/dist/worker.js"]
