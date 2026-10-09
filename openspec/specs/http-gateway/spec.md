# HTTP Gateway

## Purpose

Provides a Caddy gateway as the single public HTTP entry point: it serves the backend and the frontend on one origin, adds baseline security headers and keeps the internal services unexposed. TLS is terminated by whatever proxy sits in front of it.

## Requirements

### Requirement: Single public entry point

The gateway (`apps/gateway/Caddyfile`) SHALL serve plain HTTP on `:80` with HTTP/1.1 and h2c, its admin API off and automatic HTTPS off. The site body SHALL live in `apps/gateway/routes.caddy`: `/rpc/*`, `/api/*`, `/doc` and `/scalar*` SHALL be proxied to the backend (`BACKEND_URL`, default `backend:3000`), `/health` SHALL be answered by the gateway itself with `200 ok`, and every other path SHALL be proxied to the frontend (`FRONTEND_URL`, default `frontend:4321`). Responses SHALL be compressed with zstd or gzip when the client accepts it.

#### Scenario: API call on the page's origin

- **WHEN** the browser sends `POST /rpc/v0/deploy/trigger` or `GET /api/auth/get-session` to the public URL
- **THEN** the gateway SHALL forward it to the backend and relay the response, including its `Set-Cookie` headers

#### Scenario: Page request

- **WHEN** the browser requests `/stacks`
- **THEN** the gateway SHALL forward it to the frontend

#### Scenario: Gateway health

- **WHEN** compose requests `http://localhost/health` inside the gateway container
- **THEN** the gateway SHALL answer `200` without contacting the backend or the frontend

### Requirement: Baseline security headers

Every gateway response SHALL carry `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin` and a `Permissions-Policy` that disables `camera`, `microphone`, `geolocation`, `payment` and `usb`, and SHALL omit the `Server` header. The gateway SHALL NOT set `Strict-Transport-Security` (the TLS proxy in front owns it) nor a `Content-Security-Policy`.

#### Scenario: Framed by another site

- **WHEN** a page on another origin embeds the dashboard in an `<iframe>`
- **THEN** the browser SHALL refuse to render it

### Requirement: Dev proxy parity

The Docker dev stack (`bun run dev`) SHALL put the same gateway image and `routes.caddy` in front of the apps, publishing `http://localhost:4321` and forwarding pages (including the HMR websocket) to `astro dev`, so development routes like production. For native development (`bun run dev:local`), the Vite dev server (`apps/frontend/astro.config.mjs`) SHALL proxy `/api/`, `/rpc/`, `/doc` and `/scalar` to `BACKEND_URL` (default `http://localhost:3000`), mirroring `routes.caddy`. A route added to or removed from one SHALL be changed in the other.

#### Scenario: Docs in the Docker dev stack

- **WHEN** a developer opens `http://localhost:4321/scalar` during `bun run dev`
- **THEN** the gateway SHALL forward the request to the backend over the stack's network

#### Scenario: Docs in native development

- **WHEN** a developer opens `http://localhost:4321/scalar` during `bun run dev:local`
- **THEN** Vite SHALL proxy the request to the backend on port `3000`
