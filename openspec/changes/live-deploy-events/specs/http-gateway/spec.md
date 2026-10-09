## MODIFIED Requirements

### Requirement: Single public entry point

The gateway (`apps/gateway/Caddyfile`) SHALL serve plain HTTP on `:80` with HTTP/1.1 and h2c, its admin API off and automatic HTTPS off. The site body SHALL live in `apps/gateway/routes.caddy`: `/rpc/*`, `/api/*`, `/doc` and `/scalar*` SHALL be proxied to the backend (`BACKEND_URL`, default `backend:3000`), `/health` SHALL be answered by the gateway itself with `200 ok`, and every other path SHALL be proxied to the frontend (`FRONTEND_URL`, default `frontend:4321`). Responses SHALL be compressed with zstd or gzip when the client accepts it, except `text/event-stream` responses, which SHALL be relayed uncompressed and flushed event by event.

#### Scenario: API call on the page's origin

- **WHEN** the browser sends `POST /rpc/v0/deploy/trigger` or `GET /api/auth/get-session` to the public URL
- **THEN** the gateway SHALL forward it to the backend and relay the response, including its `Set-Cookie` headers

#### Scenario: Page request

- **WHEN** the browser requests `/stacks`
- **THEN** the gateway SHALL forward it to the frontend

#### Scenario: Gateway health

- **WHEN** compose requests `http://localhost/health` inside the gateway container
- **THEN** the gateway SHALL answer `200` without contacting the backend or the frontend

#### Scenario: Event stream through the gateway

- **WHEN** the dashboard subscribes to `v0.deploy.watch` with `Accept-Encoding: gzip, zstd`
- **THEN** the gateway SHALL relay each event as soon as the backend sends it, without a `Content-Encoding`
