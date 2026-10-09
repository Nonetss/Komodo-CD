# Komodo Connection

## Purpose

Stores the connection to the Komodo instance (URL, API key and secret), keeps a single Komodo client alive in the backend and lets a signed-in user add, inspect, replace or remove it from the Credentials page. Every Komodo call (deploy, stacks) depends on it.

## Requirements

### Requirement: Single stored connection

The connection SHALL be stored in the `komodo` table (`name`, `url`, `key`, `secret`, timestamps; `name` unique). In practice there SHALL be at most one row: saving when a row exists SHALL update that row's `url`, `key` and `secret` (keeping its `name`) instead of inserting another one.

#### Scenario: First save inserts the connection

- **WHEN** `v0.credentials.save` is called and the `komodo` table is empty
- **THEN** the system SHALL insert one row with the given name, URL, key and secret

#### Scenario: Saving again replaces the connection

- **WHEN** `v0.credentials.save` is called and a connection already exists
- **THEN** the existing row SHALL be updated with the new URL, key and secret and the table SHALL still hold one row

### Requirement: Komodo client lifecycle

On boot, the backend SHALL build the Komodo client from the stored connection (`komodoService.initialize()`, API-key auth with `key` and `secret`). With no row, or with a row missing `url`, `key` or `secret`, it SHALL log a warning and leave the client unset instead of failing the boot. Saving a connection SHALL rebuild the client immediately, and deleting it SHALL drop the client, so later Komodo calls fail with `SERVICE_UNAVAILABLE` (`503`) until a new connection is saved.

#### Scenario: Boot without a connection

- **WHEN** the backend starts with an empty `komodo` table
- **THEN** it SHALL log that Komodo is not configured, finish booting and answer Komodo-dependent calls with `503`

#### Scenario: Connection saved at runtime

- **WHEN** a user saves a valid connection while the backend is running
- **THEN** the next call to `v0.stacks.list` SHALL use the new client without a restart

### Requirement: Manage the connection through the API

The system SHALL expose, as `sessionProcedure`s under the `Credentials` OpenAPI tag:

- `v0.credentials.list` (`GET /api/v0/deploy/credentials`) returning `{ success, credentials: [{ id, name, url }] }`;
- `v0.credentials.save` (`POST /api/v0/deploy/credentials`) with `{ name, url, key, secret }` (non-empty strings, `url` a valid URL);
- `v0.credentials.remove` (`DELETE /api/v0/deploy/credentials`) with `{ name }`.

`key` and `secret` SHALL never leave the backend in any response. Removing a name that does not exist SHALL fail with `NOT_FOUND` (`404`).

#### Scenario: Secrets are never returned

- **WHEN** a connection with a key and a secret is saved and `v0.credentials.list` is called
- **THEN** each returned item SHALL contain only `id`, `name` and `url`

#### Scenario: Removing an unknown connection

- **WHEN** `v0.credentials.remove` is called with a name that is not stored
- **THEN** the call SHALL fail with `NOT_FOUND`

#### Scenario: CI key cannot touch the connection

- **WHEN** a request authenticated only with `x-api-key` calls any `v0.credentials.*` procedure
- **THEN** the system SHALL reject it as `FORBIDDEN` (`403`)

### Requirement: Credentials page

The dashboard SHALL provide a Credentials page at `/credentials` (navigation label "Connection"). With no connection it SHALL show an empty state with a button to add one. With a connection it SHALL show a summary with the name, the URL (as an external link), whether Komodo is reachable and how many stacks it reports (derived from `v0.stacks.list`, showing the Komodo error when it fails), plus actions to replace or delete it. Deleting SHALL require a second click on the same button within 3 seconds. The form SHALL validate name, URL, key and secret on the client, mask key and secret, warn that saving replaces the current connection when one exists, and after a save or delete SHALL invalidate the credentials and stacks queries. The page SHALL also show a step-by-step guide on where to obtain the API key and secret in Komodo, and the ntfy section (see `failure-notifications`).

#### Scenario: Add the first connection

- **WHEN** a user with no connection clicks the add button, fills name, URL, key and secret and saves
- **THEN** the page SHALL call `v0.credentials.save`, show a success toast and switch to the summary

#### Scenario: Unreachable Komodo

- **WHEN** a connection exists but `v0.stacks.list` fails
- **THEN** the summary SHALL mark Komodo as unreachable and show the error message

#### Scenario: Delete needs confirmation

- **WHEN** the user clicks delete once and does not click again within 3 seconds
- **THEN** the button SHALL return to its normal state and nothing SHALL be deleted
