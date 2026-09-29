# frontend

Dashboard de Komodo CD: **Astro 7** (SSR, adapter Node) + **React 19** + **Tailwind CSS 4** + shadcn/ui.

- Datos: cliente **oRPC** tipado con el router de `@komodo-cd/api` ([`src/lib/orpc.ts`](src/lib/orpc.ts)) + **TanStack Query** (hooks en `src/components/features/dashboard/hooks/`).
- Auth: cliente de Better Auth ([`src/lib/auth-client.ts`](src/lib/auth-client.ts)); el middleware de Astro valida la sesión en SSR.
- Producción: **Caddy** expone el `:80` y enruta `/api`, `/rpc`, `/doc` y `/scalar` al backend y el resto al SSR de Astro ([`Caddyfile`](Caddyfile)). En desarrollo, el proxy de Vite hace lo mismo ([`astro.config.mjs`](astro.config.mjs)).
- El build empaqueta todas las dependencias en `dist/server`, así que la imagen final no lleva `node_modules`.

```bash
bun run dev   # o `bun run dev:frontend` desde la raíz
```

Variables: ver [`.env.example`](.env.example).
