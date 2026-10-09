# HTTP Server

## Purpose

Defines the backend process: a Hono app on Bun that mounts Better Auth, oRPC, the REST API and the OpenAPI docs, guards every request with CORS, a body limit and request logging, bootstraps the database and Komodo on start, and shuts down in order on a signal.

## Requirements

### Requirement: Routes and middleware order

The backend (`apps/backend/src/index.ts`) SHALL listen on port `3000` and apply, for every request and in this order: CORS, the request logger, a 1 MiB body limit, then the routes. `GET /health-check` SHALL answer `200` with `{ "message": "API is running" }` without authentication. Better Auth (`/api/auth/*`) SHALL be mounted before the session middleware; the session middleware SHALL then resolve the caller for oRPC (`/rpc/*`), the REST API (`/api/*`) and the docs (`/doc`, `/scalar`).

#### Scenario: Health check

- **WHEN** a client requests `GET /health-check`
- **THEN** the backend SHALL answer `200` without resolving a session

### Requirement: CORS limited to the app origin

CORS SHALL allow only the origin in `BETTER_AUTH_URL`, with credentials, the headers `Content-Type`, `Authorization` and `x-api-key`, and the methods `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE` and `OPTIONS`. Same-origin dashboard traffic and server-to-server CI calls SHALL NOT depend on CORS.

#### Scenario: Foreign origin

- **WHEN** a browser page on another origin calls the API with credentials
- **THEN** the response SHALL NOT carry an `Access-Control-Allow-Origin` for that origin

### Requirement: Request body limit

Request bodies larger than 1 MiB SHALL be rejected with `413` and `{ "message": "Payload Too Large" }` before being parsed, both in the Hono middleware and in Bun's `maxRequestBodySize`.

#### Scenario: Oversized body

- **WHEN** a client posts a 2 MiB body to `/api/v0/deploy`
- **THEN** the backend SHALL answer `413` without running the procedure

### Requirement: Boot sequence

On start, the backend SHALL apply the database migrations, seed the admin user and initialize the Komodo client, in that order, before serving requests. If migrations or the Komodo initialization throw, it SHALL log `bootstrap failed` and exit with status `1`. Under `bun --hot`, the bootstrap and the signal handlers SHALL run only once per process, while each reload SHALL hot-swap the server's `fetch` handler on the same port.

#### Scenario: Migration failure

- **WHEN** a migration fails at boot
- **THEN** the process SHALL exit with status `1` and never listen on port `3000`

#### Scenario: Hot reload in development

- **WHEN** a backend source file changes during `bun run dev`
- **THEN** the server SHALL serve the new code without re-running migrations or the seed and without reopening the port

### Requirement: Graceful shutdown

On `SIGINT` or `SIGTERM`, the backend SHALL first end every open deploy event stream, then stop accepting HTTP requests, give in-flight requests up to 5 seconds to finish before closing their connections, then close the database connection, and exit with `0` (or `1` if a step failed). The whole shutdown SHALL be bounded at 8 seconds, after which the process SHALL exit with `1`, so it always ends before Docker's 10-second kill. A second signal during shutdown SHALL be ignored.

#### Scenario: Container stop

- **WHEN** Docker sends `SIGTERM` while a deploy request is in flight
- **THEN** the backend SHALL let that request finish (up to 5 seconds), close the database and exit before Docker kills it

#### Scenario: Open event streams do not hold the drain

- **WHEN** Docker sends `SIGTERM` while two dashboards are subscribed to `v0.deploy.watch` and no other request is in flight
- **THEN** both streams SHALL end and the HTTP server SHALL stop without waiting for the 5-second drain timeout
