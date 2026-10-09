## MODIFIED Requirements

### Requirement: REST API

The backend SHALL serve the router with oRPC's `OpenAPIHandler` under the `/api` prefix, using each procedure's `.route()` method and path (e.g. `POST /api/v0/deploy`, `GET /api/v0/deploy/events`, `GET /api/v0/stacks`, `GET /api/v0/history`, `GET|POST|DELETE /api/v0/apikeys`, `GET|POST|DELETE /api/v0/deploy/credentials`, `GET|POST|DELETE /api/v0/deploy/credentials/ntfy`, `POST /api/v0/deploy/credentials/ntfy/test`). Paths that match no procedure SHALL fall through so `/api/auth/*` keeps working. Unexpected errors SHALL be logged as `openapi error` with the request's logger. Procedures whose output is an event iterator SHALL be served as `text/event-stream`.

#### Scenario: Deploy with curl

- **WHEN** a pipeline sends `curl -X POST <app-url>/api/v0/deploy -H "x-api-key: …" -H "Content-Type: application/json" -d '{"stack":"web","action":"pull"}'`
- **THEN** the backend SHALL run `v0.deploy.trigger` and answer with its JSON result

#### Scenario: Follow deploys with curl

- **WHEN** a client sends `curl -N <app-url>/api/v0/deploy/events -H "x-api-key: …"`
- **THEN** the backend SHALL answer with a `text/event-stream` response whose first event is `subscribed`
