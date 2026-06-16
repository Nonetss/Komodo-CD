FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .

RUN bun run build

# ── Imagen final ─────────────────────────────────────────────────────────────
FROM oven/bun:1
WORKDIR /app

RUN apt-get update && apt-get install -y nginx gettext-base && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/gateway/nginx.conf ./gateway/nginx.conf
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

RUN chmod +x /app/entrypoint.sh

# Astro SSR corre internamente en el puerto 4321
ENV HOST=0.0.0.0
ENV PORT=4321

# Nginx escucha en el 80 y hace proxy al backend y al Astro
EXPOSE 80
CMD ["/app/entrypoint.sh"]
