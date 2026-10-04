---
title: Development
description: Run the monorepo locally, the scripts it ships with, and how the images and this site are published.
order: 9
---

## Layout

Komodo CD is a Turborepo monorepo with Bun workspaces.

| Path | What |
| --- | --- |
| `apps/backend` | Bun + Hono: a thin server for Better Auth, oRPC and OpenAPI. |
| `apps/frontend` | Astro 7 (SSR) + React + TanStack Query, with the Caddy of the production image. |
| `apps/site` | This website: static Astro, published to GitHub Pages. |
| `packages/api` | oRPC routers (`v0`), the Komodo client and the ntfy service. |
| `packages/auth` | Better Auth config and the session resolver (cookie or `x-api-key`). |
| `packages/db` | Drizzle (SQLite/libsql): schema, relations, migrations and seed. |
| `packages/env` | Validated server environment (t3-env + zod). |
| `packages/logger` | Shared pino logger. |
| `packages/config` | Shared `tsconfig`. |

## Run it

Requires [Bun](https://bun.sh) 1.4 or newer.

```bash
bun install
cp apps/backend/.env.example apps/backend/.env   # SQLite: DATABASE_URL=file:./dev.db

bun run dev            # backend (:3000) + frontend (:4321) with turbo watch
bun run dev:backend    # only the backend
bun run dev:frontend   # only the frontend
```

In development the Vite dev server proxies `/api`, `/rpc`, `/doc` and `/scalar` to the backend, the same routing Caddy does in production.

## Scripts

| Script | Does |
| --- | --- |
| `bun run build` | Builds every app (`turbo build`). |
| `bun run check-types` | Type-checks every app and package. |
| `bun run format` | Formats with Biome. |
| `bun run check` | Biome lint and format, with autofix. |
| `bun run db:generate` | Generates Drizzle migrations from the schema. |
| `bun run db:studio` | Opens Drizzle Studio. |
| `bun run docker:up` | Builds the images from source and starts the stack. |

## Docker images

The Dockerfiles live in `apps/*/Dockerfile`, but the build context is always the repository root:

```bash
docker build -f apps/backend/Dockerfile -t komodo-cd-backend .
docker build -f apps/frontend/Dockerfile -t komodo-cd-frontend .
```

`.github/workflows/docker-build.yml` builds and pushes both to `ghcr.io/nonetss/komodo-cd-backend` and `ghcr.io/nonetss/komodo-cd-frontend`:

| Trigger | Tags |
| --- | --- |
| Push to `main` | `latest`, `main`, `main-<sha>` |
| Tag `vX.Y.Z` | `X.Y.Z`, `X.Y` |

To publish a release, tag the commit and create the GitHub release:

```bash
git tag -a v1.0.0 -m "v1.0.0" && git push origin v1.0.0
gh release create v1.0.0 --generate-notes
```

## This site

```bash
bun run site   # http://localhost:4322/Komodo-CD/
```

The pages are Markdown in `apps/site/src/content/docs/<lang>/`, one file per language, and the landing copy is in `apps/site/src/i18n/ui.ts`. The screenshots are the ones in the root `img/` directory, shared with the README. `.github/workflows/pages.yml` publishes the site to GitHub Pages on every push to `main` that touches it.
