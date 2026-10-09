# Build context: raíz del monorepo
#   docker build -f apps/gateway/Dockerfile .
FROM caddy:2-alpine

COPY apps/gateway/Caddyfile apps/gateway/routes.caddy /etc/caddy/

# 80: la única entrada pública (el único puerto que publica compose)
EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
