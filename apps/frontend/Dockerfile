# Build context: raíz del monorepo
#   docker build -f apps/frontend/Dockerfile .
# Igual que `packageManager` en el package.json raíz: mantenlos sincronizados
ARG BUN_VERSION=1.4.0

FROM oven/bun:${BUN_VERSION} AS builder
WORKDIR /app

# Solo manifests: la capa de install queda cacheada hasta que cambie un
# package.json o el lockfile.
COPY package.json bun.lock bunfig.toml ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY apps/site/package.json apps/site/
COPY packages/api/package.json packages/api/
COPY packages/auth/package.json packages/auth/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/env/package.json packages/env/
COPY packages/logger/package.json packages/logger/
RUN --mount=type=cache,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile --filter frontend

# packages/ solo aporta tipos (el cliente oRPC importa AppRouter como type).
COPY packages packages
COPY apps/frontend apps/frontend
ENV NODE_ENV=production
# vite.ssr.noExternal (astro.config.mjs) empaqueta todas las dependencias en
# dist/server, así que la imagen final no necesita node_modules.
RUN cd apps/frontend && bun run build

# ── Imagen final ─────────────────────────────────────────────────────────────
FROM oven/bun:${BUN_VERSION}-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/frontend/dist ./dist

# Solo el SSR de Astro: lo publica el gateway (apps/gateway), que manda aquí
# todo lo que no es del backend por la red de compose.
ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321
USER bun
CMD ["bun", "dist/server/entry.mjs"]
