# Docker Deployment

## Purpose

Packages Komodo CD as three images (backend, frontend, gateway) published to GHCR and run with Docker Compose, with health-ordered startup, persistent SQLite storage and an interactive installer that writes the deployment's `.env`.

## Requirements

### Requirement: Compose stack

`compose.yml` SHALL run the services `backend`, `frontend` and `gateway` from `ghcr.io/nonetss/komodo-cd-{backend,frontend,gateway}:latest` on one private network, each with `init: true` and `restart: unless-stopped`. Only `gateway` SHALL publish a port (`${PORT:-80}:80`). The backend SHALL get `DATABASE_URL=file:/data/db.sqlite` on the `db_data` volume, `BETTER_AUTH_URL` from `APP_URL` and the seed admin variables; compose SHALL refuse to start without `APP_URL`, `BETTER_AUTH_SECRET` and `SEED_ADMIN_PASSWORD`. The frontend SHALL reach the backend at `http://backend:3000`.

#### Scenario: Missing secret

- **WHEN** `docker compose up` runs without `BETTER_AUTH_SECRET` in the environment or `.env`
- **THEN** compose SHALL fail with `BETTER_AUTH_SECRET is required`

#### Scenario: Backend not exposed

- **WHEN** the stack runs and a client outside the Docker network connects to port `3000` or `4321` on the host
- **THEN** the connection SHALL fail, because only the gateway publishes a port

### Requirement: Health-ordered startup

The backend SHALL be healthy when `GET /health-check` succeeds, the frontend when `GET /login` succeeds, and the gateway when its `/health` answers. The frontend SHALL start only once the backend is healthy, and the gateway only once both are healthy.

#### Scenario: Slow first boot

- **WHEN** the backend is still applying migrations
- **THEN** the frontend and the gateway SHALL wait for it to become healthy before starting

### Requirement: Images

All images SHALL be built with the monorepo root as context. The backend image SHALL install production dependencies for the backend workspace only, run the TypeScript sources with Bun as the non-root `bun` user, expose `3000` and own the `/data` directory. The frontend image SHALL build Astro with every dependency bundled into `dist/server` and run only `dist/server/entry.mjs` on `0.0.0.0:4321` as `bun`, without `node_modules`. The gateway image SHALL be `caddy:2-alpine` with `Caddyfile` and `routes.caddy`, exposing `80`. The Bun version in the Dockerfiles SHALL match `packageManager` in the root `package.json`. `compose.build.yml` SHALL extend `compose.yml` to build the same three images locally.

#### Scenario: Local build

- **WHEN** a developer runs `bun run docker:up`
- **THEN** compose SHALL build the three images from the checkout and start them like the published stack

### Requirement: Interactive installer

`scripts/bootstrap.sh` (also reachable through `scripts/start.sh` and `curl … | bash`) SHALL, in the current directory: require `docker` with Compose v2, `openssl`, `curl` and a terminal; abort before asking anything if `.env` already exists; ask for the host port (1–65535, read as decimal), the public URL (default derived from the port, `http(s)://` required, trailing slash removed, with a warning for plain HTTP on a non-local host), the admin name, email and password (at least 8 characters); show a summary and ask for confirmation; download `compose.yml` from the `KCD_REF` ref (default `main`) when missing, before writing anything else; write `.env` atomically with mode `600` and a random `BETTER_AUTH_SECRET`, quoting values so Compose reads them verbatim; and optionally pull and start the stack.

#### Scenario: Existing installation

- **WHEN** the installer runs in a directory that already has a `.env`
- **THEN** it SHALL exit with an error before prompting

#### Scenario: Network error while downloading compose

- **WHEN** `compose.yml` cannot be downloaded
- **THEN** the installer SHALL fail without writing `.env`, so it can be run again

#### Scenario: Password with special characters

- **WHEN** the admin password contains `$`, `"` or `\`
- **THEN** Compose SHALL read it from `.env` exactly as typed
