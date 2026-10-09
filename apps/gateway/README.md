# gateway

Caddy delante de las dos apps: es el único servicio que publica un puerto (`:80`, en el host como `PORT`).

| Ruta                               | Va a                         |
| ---------------------------------- | ---------------------------- |
| `/rpc/*`, `/api/*`, `/doc`, `/scalar*` | backend (`backend:3000`)  |
| `/health`                          | lo responde el propio gateway |
| todo lo demás                      | frontend (`frontend:4321`)   |

- [`Caddyfile`](Caddyfile): el sitio de producción, HTTP plano en `:80` (el TLS lo termina el proxy de delante).
- [`routes.caddy`](routes.caddy): el enrutado y las cabeceras de seguridad. En desarrollo el proxy de Vite ([`apps/frontend/astro.config.mjs`](../frontend/astro.config.mjs)) hace lo mismo; si cambias una ruta, cámbiala en los dos.
- `BACKEND_URL` y `FRONTEND_URL` (host:puerto) cambian los destinos; por defecto, los servicios de compose.
