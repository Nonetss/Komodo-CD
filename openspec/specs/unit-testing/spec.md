# Unit Testing

## Purpose

Defines how the API is tested: `bun test` suites in `packages/api` that call the real procedures in-process, against an in-memory database with the real migrations and with Komodo and ntfy replaced by spies.

## Requirements

### Requirement: One root command

`bun run test` (`turbo test`) SHALL run every workspace that declares a `test` script — today `packages/api`, whose suite runs with `bun test` rooted at `tests/` — and SHALL exit non-zero when any test fails.

#### Scenario: A failing test fails the command

- **WHEN** any test in `packages/api/tests/` fails
- **THEN** `bun run test` SHALL exit with a non-zero status

### Requirement: Hermetic test environment

A preload file (`packages/api/tests/setup.ts`) SHALL, before any app module is imported, overwrite the server environment with test values (`NODE_ENV=test`, `LOG_LEVEL=fatal`, `DATABASE_URL=file::memory:`, a fixed auth URL and secret, empty seed admin variables) and apply the real migrations. Tests SHALL NOT depend on a root `.env`, a running backend, Komodo or ntfy: the Komodo and ntfy services SHALL be replaced with spies (`spyOn`) for the duration of a test and restored afterwards.

#### Scenario: No env file

- **WHEN** the suite runs on a machine with no `.env` and no network access
- **THEN** every test SHALL still pass

### Requirement: Calls through the router

Procedure tests SHALL invoke procedures with oRPC's `call()` on `appRouter`, with contexts from `tests/fixtures/context.ts` (`anonymousContext`, `sessionContext`, `apiKeyContext`), and SHALL assert failures by error code with `expectErrorCode` (`tests/fixtures/errors.ts`).

#### Scenario: Testing a session-only procedure

- **WHEN** a test calls `v0.credentials.list` with `apiKeyContext()`
- **THEN** it SHALL assert the `FORBIDDEN` code with `expectErrorCode`

### Requirement: Coverage of procedures and helpers

A new or changed procedure or API helper SHALL ship with tests. The suite SHALL at least cover: the access tiers (anonymous `401`, API key on a session-only procedure `403`, session accepted); that Komodo `key` and `secret` are never returned and that removing an unknown connection answers `404`; and the deploy flow (`pull-redeploy` pulls then redeploys and records a success, `pull` only pulls, a Komodo failure answers `502` with its message, is recorded and alerts, and no connection answers `503`).

#### Scenario: New procedure without tests

- **WHEN** a change adds a procedure to `packages/api/src/v0/`
- **THEN** the same change SHALL add tests for it under `packages/api/tests/`
