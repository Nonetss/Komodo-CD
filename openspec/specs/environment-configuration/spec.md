# Environment Configuration

## Purpose

Configures every workspace from one root `.env` file validated by a single schema, and generates that file for local development and for deployments.

## Requirements

### Requirement: One env file

The repository SHALL have a single env file, the root `.env`, with `.env.example` as its template. The backend (through `packages/env`), the Drizzle CLI (`packages/db/drizzle.config.ts`) and the frontend (Astro config and `vite.envDir`) SHALL load it, and compose SHALL read it in deployments. Variables already defined in the process environment SHALL win over the file. Per-app `.env` files SHALL NOT be used.

#### Scenario: Shell override

- **WHEN** `LOG_LEVEL=debug` is exported in the shell and the `.env` sets `LOG_LEVEL=info`
- **THEN** the backend SHALL log at `debug`

### Requirement: Validated server environment

`packages/env/src/server.ts` SHALL validate the server environment at import time with these rules:

- `DATABASE_URL`: required, a SQLite/libsql URL (`file:`, `libsql:`, `http(s):`, `ws(s):`), rejecting Postgres URLs;
- `BETTER_AUTH_URL`: required URL, falling back to `APP_URL` when unset;
- `BETTER_AUTH_SECRET`: required, at least 32 characters;
- `NODE_ENV`: `development`, `production` or `test`, default `development`;
- `LOG_LEVEL`: `fatal`, `error`, `warn`, `info`, `debug` or `trace`, default `info`;
- `SEED_ADMIN_EMAIL` (optional email), `SEED_ADMIN_NAME` (default `Admin`), `SEED_ADMIN_PASSWORD` (optional, at least 8 characters).

Empty strings SHALL count as unset. Validation SHALL be skippable only with `SKIP_ENV_VALIDATION`.

#### Scenario: Postgres URL

- **WHEN** the backend starts with `DATABASE_URL=postgres://…`
- **THEN** validation SHALL fail with a message saying a SQLite/libsql URL is required

#### Scenario: Compose passes APP_URL

- **WHEN** only `APP_URL` is set
- **THEN** `BETTER_AUTH_URL` SHALL take its value

### Requirement: Frontend environment

The frontend SHALL declare `BACKEND_URL` (server-only secret, read at runtime, default `http://localhost:3000`), used by the SSR session check and the dev proxy, and `PUBLIC_APP_URL` (public, optional, embedded at build time) for the URL in the `curl` snippets.

#### Scenario: No public URL at build time

- **WHEN** the frontend is built without `PUBLIC_APP_URL`
- **THEN** the snippets SHALL use the browser's origin after hydration

### Requirement: Development env generator

`bun run setup:dev` (`scripts/setup-dev.sh`) SHALL write the root `.env` from `.env.example` with `APP_URL=http://localhost:4321`, a random `BETTER_AUTH_SECRET` and a random admin password (both from `openssl`) and the admin email `admin@komodo-cd.local`, with file mode `600`, and print the admin credentials. An existing `.env` SHALL be kept unless `--force` is given. It SHALL warn about, and never delete, leftover `apps/*/.env` files.

#### Scenario: Existing env file

- **WHEN** `bun run setup:dev` runs and `.env` exists
- **THEN** the script SHALL leave it untouched and say so
