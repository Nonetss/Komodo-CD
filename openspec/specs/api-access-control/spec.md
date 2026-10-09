# API Access Control

## Purpose

Defines the authorization tiers every procedure is built from, so that CI pipelines holding an API key can deploy and read state but only a person signed into the dashboard can change the configuration or the credentials.

## Requirements

### Requirement: Procedure tiers

`packages/api/src/index.ts` SHALL define three procedure builders sharing the error map:

- `publicProcedure`: no authentication;
- `protectedProcedure`: requires a resolved user — a signed-in session or a valid `x-api-key` — and fails with `UNAUTHORIZED` (`401`) otherwise;
- `sessionProcedure`: a `protectedProcedure` that additionally requires a browser session and fails with `FORBIDDEN` (`403`, message stating that a signed-in session is required, not an API key) when the user came from an API key.

The `401` check SHALL run before the session check, so an anonymous call to a `sessionProcedure` answers `401`, not `403`.

#### Scenario: Anonymous call to a protected procedure

- **WHEN** a request with neither a cookie nor a valid key calls `v0.history.list`
- **THEN** it SHALL fail with `UNAUTHORIZED`

#### Scenario: API key on a session-only procedure

- **WHEN** a request authenticated with `x-api-key` calls `v0.credentials.list`, `v0.credentials.ntfy.get` or `v0.apiKey.list`
- **THEN** it SHALL fail with `FORBIDDEN`

#### Scenario: Anonymous call to a session-only procedure

- **WHEN** an anonymous request calls `v0.credentials.list`
- **THEN** it SHALL fail with `UNAUTHORIZED`

### Requirement: Tier per procedure

What CI needs SHALL use `protectedProcedure`: `v0.deploy.trigger`, `v0.deploy.watch`, `v0.stacks.list`, `v0.history.list`, `v0.history.activity`, `v0.security.list`, `v0.security.get` and `v0.security.scan`. Everything that reads or changes configuration or credentials SHALL use `sessionProcedure`: every `v0.credentials.*` procedure (Komodo connection and ntfy) and every `v0.apiKey.*` procedure. `v0.stacks.remove` SHALL also use `sessionProcedure`: deleting a Komodo resource is not something CI needs. A new procedure SHALL pick its tier by the same rule.

#### Scenario: CI cannot mint keys

- **WHEN** a request authenticated with `x-api-key` calls `v0.apiKey.create`
- **THEN** it SHALL fail with `FORBIDDEN` and no key SHALL be created

#### Scenario: Signed-in user configures Komodo

- **WHEN** a signed-in browser session calls `v0.credentials.save`
- **THEN** the call SHALL be authorized

#### Scenario: CI watches deploys

- **WHEN** a request authenticated with `x-api-key` calls `v0.deploy.watch`
- **THEN** the call SHALL be authorized and stream deploy events

#### Scenario: CI gates on vulnerabilities

- **WHEN** a request authenticated with `x-api-key` calls `v0.security.list` or `v0.security.scan`
- **THEN** the call SHALL be authorized
### Requirement: Shared error map

Procedures SHALL throw errors only through the constructor map in `packages/api/src/errors.ts`, which defines `BAD_REQUEST` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500), `BAD_GATEWAY` (502, Komodo failed or is unreachable) and `SERVICE_UNAVAILABLE` (503, no Komodo connection, or no Trivy server configured for a scan). The same codes and statuses SHALL apply over oRPC and over the REST API.

#### Scenario: Status over REST

- **WHEN** a REST call to `/api/v0/stacks` fails because Komodo is not configured
- **THEN** the HTTP status SHALL be `503`