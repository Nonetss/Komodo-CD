# backend

Servidor Hono (Bun) de Komodo CD. Es una capa fina: monta Better Auth, la API oRPC y la documentación; la lógica vive en `packages/`.

| Ruta           | Qué sirve                                                         |
| -------------- | ----------------------------------------------------------------- |
| `/api/auth/*`  | Better Auth (`@komodo-cd/auth`)                                   |
| `/api/v0/*`    | API REST pública (OpenAPI) — la que usan GitHub/Gitea Actions      |
| `/rpc/*`       | Protocolo RPC de oRPC — lo consume el frontend con cliente tipado |
| `/doc`         | Especificación OpenAPI                                            |
| `/scalar`      | Referencia interactiva (Scalar)                                   |
| `/health-check`| Health check                                                      |

Al arrancar aplica las migraciones, crea el admin inicial (`SEED_ADMIN_*`) e inicializa el cliente de Komodo.

```bash
cp .env.example .env
bun run dev   # o `bun run dev:backend` desde la raíz
```

Variables: ver [`.env.example`](.env.example) y el esquema en [`packages/env/src/server.ts`](../../packages/env/src/server.ts).
