# Build context: raíz del monorepo
#   docker build -f apps/frontend/Dockerfile .
FROM oven/bun:1 AS builder
WORKDIR /app

# Solo manifests: la capa de install queda cacheada hasta que cambie un
# package.json o el lockfile.
COPY package.json bun.lock bunfig.toml ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY packages/api/package.json packages/api/
COPY packages/auth/package.json packages/auth/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/env/package.json packages/env/
COPY packages/logger/package.json packages/logger/
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --filter frontend

# packages/ solo aporta tipos (el cliente oRPC importa AppRouter como type).
COPY packages packages
COPY apps/frontend apps/frontend
ENV NODE_ENV=production
# vite.ssr.noExternal (astro.config.mjs) empaqueta todas las dependencias en
# dist/server, así que la imagen final no necesita node_modules.
RUN cd apps/frontend && bun run build

# ── Imagen final ─────────────────────────────────────────────────────────────
FROM oven/bun:1-slim
COPY --from=caddy:2-alpine /usr/bin/caddy /usr/local/bin/caddy
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/frontend/dist ./dist
COPY apps/frontend/Caddyfile /etc/caddy/Caddyfile
COPY --chmod=755 apps/frontend/start.sh /start.sh

# Astro SSR escucha solo en localhost; Caddy expone el 80
ENV HOST=127.0.0.1
ENV PORT=4321

EXPOSE 80
# Sin root: Caddy puede abrir el :80 porque Docker fija
# net.ipv4.ip_unprivileged_port_start=0 en los contenedores (Docker >= 20.10).
USER bun
CMD ["/start.sh"]
