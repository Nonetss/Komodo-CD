# Build context: raíz del monorepo
#   docker build -f apps/backend/Dockerfile .
# Igual que `packageManager` en el package.json raíz: mantenlos sincronizados
ARG BUN_VERSION=1.4.0

FROM oven/bun:${BUN_VERSION} AS base
WORKDIR /app

# ── Dependencias ────────────────────────────────────────────────────────────
# Solo manifests: la capa de install queda cacheada hasta que cambie un
# package.json o el lockfile. Todos los package.json del workspace deben estar
# presentes o --frozen-lockfile rechaza la instalación.
FROM base AS install
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
    bun install --frozen-lockfile --production --ignore-scripts --filter backend

# ── Imagen final ─────────────────────────────────────────────────────────────
# Bun ejecuta TypeScript directamente: se copian las fuentes del backend y de
# los paquetes del workspace (incluidas las migraciones de packages/db).
FROM oven/bun:${BUN_VERSION}-slim AS release
WORKDIR /app
# Con el linker "isolated", los node_modules de cada workspace son symlinks a
# /app/node_modules/.bun, así que se copia todo manteniendo el layout.
COPY --from=install /app/node_modules node_modules
COPY --from=install /app/apps/backend/node_modules apps/backend/node_modules
COPY --from=install /app/packages packages
COPY packages packages
COPY apps/backend apps/backend

# Directorio persistente para la base de datos SQLite
# → montar como volumen en producción: -v komodo_data:/data
RUN mkdir -p /data && chown -R bun:bun /data
ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/db.sqlite"

WORKDIR /app/apps/backend
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]
