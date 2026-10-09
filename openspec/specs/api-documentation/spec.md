# API Documentation

## Purpose

Publishes the same oRPC router as a REST API for CI pipelines at `/api/v0/*`, with a generated OpenAPI document and an interactive Scalar reference, so GitHub or Gitea Actions can deploy with a plain `curl`.

## Requirements

### Requirement: REST API

The backend SHALL serve the router with oRPC's `OpenAPIHandler` under the `/api` prefix, using each procedure's `.route()` method and path (e.g. `POST /api/v0/deploy`, `GET /api/v0/deploy/events`, `GET /api/v0/stacks`, `GET /api/v0/history`, `GET /api/v0/history/activity`, `GET|POST|DELETE /api/v0/apikeys`, `GET|POST|DELETE /api/v0/deploy/credentials`, `GET|POST|DELETE /api/v0/deploy/credentials/ntfy`, `POST /api/v0/deploy/credentials/ntfy/test`). Paths that match no procedure SHALL fall through so `/api/auth/*` keeps working. Unexpected errors SHALL be logged as `openapi error` with the request's logger. Procedures whose output is an event iterator SHALL be served as `text/event-stream`.

#### Scenario: Deploy with curl

- **WHEN** a pipeline sends `curl -X POST <app-url>/api/v0/deploy -H "x-api-key: …" -H "Content-Type: application/json" -d '{"stack":"web","action":"pull"}'`
- **THEN** the backend SHALL run `v0.deploy.trigger` and answer with its JSON result

#### Scenario: Follow deploys with curl

- **WHEN** a client sends `curl -N <app-url>/api/v0/deploy/events -H "x-api-key: …"`
- **THEN** the backend SHALL answer with a `text/event-stream` response whose first event is `subscribed`

### Requirement: OpenAPI document and reference

The backend SHALL serve the generated OpenAPI document at `/doc` and a Scalar API reference at `/scalar`. The document SHALL be titled `Komodo CD API`, declare the server URL `/api`, and declare an `ApiKeyAuth` security scheme (`apiKey` in the `x-api-key` header) applied globally. Each procedure SHALL carry a summary and a tag (`Deploy`, `Stacks`, `History`, `Credentials`, `API Keys`); request fields SHALL carry descriptions.

#### Scenario: Browse the reference

- **WHEN** a user opens `/scalar`
- **THEN** the Scalar reference SHALL list the endpoints grouped by tag and document the `x-api-key` header

#### Scenario: Fetch the spec

- **WHEN** a client requests `GET /doc`
- **THEN** the backend SHALL answer with the OpenAPI JSON document
