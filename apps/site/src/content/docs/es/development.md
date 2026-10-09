---
title: Desarrollo
description: Arrancar el monorepo en local, sus scripts y cómo se publican las imágenes y esta web.
order: 9
---

## Estructura

Komodo CD es un monorepo de Turborepo con workspaces de Bun.

| Ruta | Qué es |
| --- | --- |
| `apps/backend` | Bun + Hono: un servidor fino para Better Auth, oRPC y OpenAPI. |
| `apps/frontend` | Astro 7 (SSR) + React + TanStack Query. |
| `apps/gateway` | El Caddy de producción: el único puerto publicado, que enruta al backend y al frontend. |
| `apps/site` | Esta web: Astro estático, publicado en GitHub Pages. |
| `trivy` | No es un workspace: un servicio de `compose.yml` con el servidor oficial `aquasec/trivy`, contra el que escanea imágenes el cliente `trivy` del backend. |
| `packages/api` | Routers oRPC (`v0`), el cliente de Komodo y los servicios de ntfy y Trivy. |
| `packages/auth` | Configuración de Better Auth y el resolvedor de sesión (cookie o `x-api-key`). |
| `packages/db` | Drizzle (SQLite/libsql): esquema, relaciones, migraciones y seed. |
| `packages/env` | Entorno del servidor validado (t3-env + zod). |
| `packages/logger` | Logger pino compartido. |
| `packages/config` | `tsconfig` compartido. |

## Arrancarlo

Necesita [Bun](https://bun.sh) 1.4 o posterior.

```bash
bun install
bun run setup:dev   # escribe .env con un secreto y una contraseña de admin aleatorios

bun run dev            # stack de desarrollo en Docker en http://localhost:4321 (recarga en caliente, Ctrl+C lo para)
bun run dev:down       # borra sus contenedores (-v también su base de datos)
bun run dev:local      # lo mismo sin Docker: backend (:3000) + frontend (:4321) con turbo watch
bun run dev:backend    # solo el backend, sin Docker
bun run dev:frontend   # solo el frontend, sin Docker
```

`bun run dev` pone el gateway de producción (`apps/gateway/routes.caddy`) delante de las dos apps, así que el enrutado en desarrollo es el de producción. Usa su propia base de datos SQLite en un volumen de Docker, aparte de `apps/backend/dev.db`. Sin Docker, el servidor de Vite reenvía `/api`, `/rpc`, `/doc` y `/scalar` al backend de la misma forma.

## Scripts

| Script | Hace |
| --- | --- |
| `bun run build` | Construye todas las apps (`turbo build`). |
| `bun run check-types` | Comprueba los tipos de todas las apps y paquetes. |
| `bun run format` | Formatea con Biome. |
| `bun run check` | Lint y formato de Biome, con autocorrección. |
| `bun run db:generate` | Genera las migraciones de Drizzle a partir del esquema. |
| `bun run db:studio` | Abre Drizzle Studio. |
| `bun run docker:up` | Construye las imágenes desde el código y arranca el stack. |

## Imágenes de Docker

Los Dockerfile están en `apps/*/Dockerfile`, pero el contexto de build es siempre la raíz del repositorio:

```bash
docker build -f apps/backend/Dockerfile -t komodo-cd-backend .
docker build -f apps/frontend/Dockerfile -t komodo-cd-frontend .
docker build -f apps/gateway/Dockerfile -t komodo-cd-gateway .
```

`.github/workflows/docker-build.yml` construye y publica las tres en `ghcr.io/nonetss/komodo-cd-backend`, `ghcr.io/nonetss/komodo-cd-frontend` y `ghcr.io/nonetss/komodo-cd-gateway`, y solo reconstruye las que tienen ficheros cambiados:

| Disparador | Etiquetas |
| --- | --- |
| Push a `main` | `latest`, `main`, `main-<sha>` |
| Tag `vX.Y.Z` | `X.Y.Z`, `X.Y` |

El servicio `trivy` no se construye aquí: usa la imagen oficial `aquasec/trivy`, en la misma versión que `TRIVY_VERSION` de `apps/backend/Dockerfile`.

Para publicar una versión, etiqueta el commit y crea la release de GitHub:

```bash
git tag -a v1.0.0 -m "v1.0.0" && git push origin v1.0.0
gh release create v1.0.0 --generate-notes
```

## Esta web

```bash
bun run dev:site   # http://localhost:4322/Komodo-CD/
```

Las páginas son Markdown en `apps/site/src/content/docs/<idioma>/`, un fichero por idioma, y los textos de la landing están en `apps/site/src/i18n/ui.ts`. Las capturas son las del directorio `img/` de la raíz, compartidas con el README. `.github/workflows/pages.yml` publica la web en GitHub Pages en cada push a `main` que la toque.
