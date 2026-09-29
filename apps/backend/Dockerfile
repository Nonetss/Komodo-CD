FROM oven/bun:1.2 AS base
WORKDIR /app

# ── Dependencias ────────────────────────────────────────────────────────────
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production --ignore-scripts

# ── Build / prerelease ───────────────────────────────────────────────────────
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
ENV NODE_ENV=production

# ── Imagen final ─────────────────────────────────────────────────────────────
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/src src
COPY --from=prerelease /app/drizzle drizzle
COPY --from=prerelease /app/package.json .
COPY --from=prerelease /app/tsconfig.json .

# Directorio persistente para la base de datos SQLite
# → montar como volumen en producción: -v komodo_data:/data
RUN mkdir -p /data && chown -R bun:bun /data
ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/db.sqlite"

USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]
