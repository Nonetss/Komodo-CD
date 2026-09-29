#!/bin/bash
set -e

bun /app/dist/server/entry.mjs &
caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &

# Sale en cuanto muere cualquiera de los dos procesos, para que el contenedor
# se reinicie en lugar de servir 502 con Astro caído detrás de Caddy.
wait -n
exit $?
