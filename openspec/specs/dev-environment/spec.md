# Dev Environment

## Purpose

Describes how the monorepo is worked on locally: Bun workspaces orchestrated by Turborepo, a Docker dev stack that runs the apps from source with hot reload behind the production gateway (or the same natively with turbo), and the shared tooling (TypeScript config, Biome, Tailwind checks) every change goes through.

## Requirements

### Requirement: Workspaces and tasks

The repository SHALL be a Bun workspace (`apps/*`, `packages/*`) with shared dependency versions in the root `catalog`, orchestrated by Turborepo. The root scripts SHALL include `dev` (the Docker dev stack), `dev:down`, `dev:local` (backend and frontend natively with `turbo watch`, excluding the site), `dev:backend`, `dev:frontend`, `dev:site`, `build`, `start`, `check-types`, `test`, the Biome scripts (`format`, `lint`, `check`), `tailwind:check` and `tailwind:fix`, the `db:*` scripts of `packages/db`, and the `docker:*` scripts over `compose.build.yml`. Internal packages SHALL be imported by their package name (`@komodo-cd/<pkg>`).

#### Scenario: Website not started by default

- **WHEN** a developer runs `bun run dev` or `bun run dev:local`
- **THEN** `apps/site` SHALL NOT be started; `bun run dev:site` starts it on port `4322`

### Requirement: Docker dev stack

`bun run dev` SHALL run `compose.dev.yml` (`docker compose up --build --watch`, project `komodo-cd-dev`) with four services: `backend` (`apps/backend/Dockerfile.dev`, `bun run --hot`, with the `trivy` CLI and `TRIVY_SERVER_URL=http://trivy:4954`), `frontend` (`apps/frontend/Dockerfile.dev`, `astro dev` on `0.0.0.0:4321`, `BACKEND_URL=http://backend:3000`), `gateway` (the production gateway image and `routes.caddy`) and `trivy` (the same pinned `aquasec/trivy` image and `trivy server` command as production, its cache on the `trivy_cache` volume). As in production, only the gateway SHALL publish a port, mapping `http://localhost:4321` to its `:80`; the backend, the frontend and `trivy` SHALL be reachable only on the stack's network. Both app containers SHALL read the root `.env` (optional), and the backend's SQLite SHALL live at `file:/data/dev.db` on the `backend_data` volume. Edits SHALL reach the containers through `docker compose watch` (no bind mounts): source folders are synced, changes to `astro.config.mjs`, `Caddyfile` or `routes.caddy` sync and restart their service, and changes to `bun.lock` or a `package.json` rebuild the image. `bun run dev:down` SHALL remove the stack's containers. Every Dockerfile, including the `Dockerfile.dev` ones, SHALL copy the `package.json` of every workspace before installing, or `--frozen-lockfile` fails.

#### Scenario: Start developing

- **WHEN** a developer runs `bun run setup:dev`, `bun install` and `bun run dev`
- **THEN** the dashboard SHALL be served on `http://localhost:4321` through the gateway, with the backend applying migrations and seeding the admin on boot

#### Scenario: Edit a procedure

- **WHEN** a developer edits a file under `packages/api/src/` while `bun run dev` runs
- **THEN** the edit SHALL be synced into the backend container and the backend SHALL hot-reload it without restarting the process

#### Scenario: New dependency

- **WHEN** `bun.lock` changes while the stack runs
- **THEN** the backend and frontend images SHALL be rebuilt and their containers recreated

#### Scenario: Scanning in the dev stack

- **WHEN** a developer opens `/security` in the Docker dev stack once the `trivy` server is ready
- **THEN** the images of the configured Komodo instance SHALL be scanned through the dev `trivy` service
### Requirement: Native development

`bun run dev:local` SHALL run the backend with `bun run --hot` and the frontend with `astro dev` directly on the host through `turbo watch`, with the backend on `:3000`, the frontend on `http://localhost:4321` (Vite proxying the backend routes) and the database at `apps/backend/dev.db`. The dev tasks SHALL be persistent, uncached and receive the root `.env` variables they need through Turborepo's pass-through environment.

#### Scenario: Develop without Docker

- **WHEN** a developer runs `bun run dev:local`
- **THEN** the backend SHALL listen on `:3000` and the frontend on `http://localhost:4321`, both reloading on edits

### Requirement: Code quality tooling

The repository SHALL be formatted and linted with Biome only (root `biome.json`: 2-space indentation, double quotes, no semicolons, 80 columns, organized imports); ESLint and Prettier SHALL NOT be used. Every workspace SHALL type-check with `check-types` (`tsc --noEmit` or `astro check`) extending `packages/config/tsconfig.base.json`. Tailwind classes in the frontend and the site SHALL be checked with `bun run tailwind:check`.

#### Scenario: Pre-merge checks

- **WHEN** a developer runs `bun run check-types`, `bunx biome check .` and `bun run test`
- **THEN** they SHALL get the same verdict the CI workflow would give for those steps
