FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ── Install dependencies ─────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/
RUN pnpm --filter @online-code-sandbox/shared build
RUN pnpm --filter web build

# ── Serve with nginx ──────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# Proxy /api to the API service; use variable for upstream to avoid startup crash
RUN printf 'server {\n\
  listen 80;\n\
  resolver 127.0.0.11 valid=10s;\n\
  location / {\n\
    root /usr/share/nginx/html;\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
  location /api {\n\
    set $upstream http://api:3000;\n\
    proxy_pass $upstream;\n\
    proxy_set_header Host $host;\n\
    proxy_set_header X-Real-IP $remote_addr;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
