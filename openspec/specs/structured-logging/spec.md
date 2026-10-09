# Structured Logging

## Purpose

Gives the backend a single pino logger with a configurable level, readable output in development and JSON in production, and one log line per request tied to a request id that is also returned to the client, so a failed CI call can be matched with the server logs.

## Requirements

### Requirement: Shared logger

`packages/logger` SHALL export one pino logger at the level `LOG_LEVEL` (default `info`). With `NODE_ENV=production` it SHALL write JSON lines to stdout; otherwise it SHALL write colourised, human-readable lines through `pino-pretty` with UTC timestamps and without `pid` and `hostname`. It SHALL use a synchronous stream, not a worker-thread transport.

#### Scenario: Production output

- **WHEN** the backend runs with `NODE_ENV=production`
- **THEN** every log entry SHALL be a single JSON line on stdout

### Requirement: Request log line and id

For every request, the backend SHALL generate a random request id (never taken from the request), create a child logger carrying `requestId`, `method` and `path`, and, once the response is ready, return the id in the `x-request-id` header and log one `request` line with `status`, `latencyMs` and the resolved `userId`. The line SHALL be logged at `error` for `5xx`, `warn` for `4xx`, `debug` for successful `/health-check` calls and `info` otherwise. The child logger SHALL be passed into the oRPC context, so errors logged by procedures and handlers carry the same request id.

#### Scenario: Correlate a CI failure

- **WHEN** a deploy from CI fails with `502`
- **THEN** the response SHALL carry `x-request-id`, and the backend's `error` line for that request and the `openapi error` or handler logs SHALL carry the same `requestId`

#### Scenario: Health checks stay quiet

- **WHEN** compose calls `/health-check` every 10 seconds with `LOG_LEVEL=info`
- **THEN** those requests SHALL NOT appear in the logs
