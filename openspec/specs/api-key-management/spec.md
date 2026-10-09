# API Key Management

## Purpose

Lets a signed-in user create, list and revoke the API keys that CI pipelines send in the `x-api-key` header, backed by the Better Auth API Key plugin, and shows each new key exactly once with a ready-to-use deploy command.

## Requirements

### Requirement: API key plugin

The backend SHALL enable the Better Auth API Key plugin with its rate limiting disabled, so CI pipelines are never throttled by it, and SHALL store keys in the `apikey` table, owned by the user in `reference_id`. The frontend auth clients SHALL include the API key client plugin.

#### Scenario: Repeated deploys from CI

- **WHEN** a pipeline calls `POST /api/v0/deploy` many times in a short period with the same key
- **THEN** the key SHALL NOT be rejected for exceeding a rate limit

### Requirement: Manage own keys through the API

The system SHALL expose, as `sessionProcedure`s under the `API Keys` tag, operating on the signed-in user's own keys through Better Auth with the request's session cookie:

- `v0.apiKey.list` (`GET /api/v0/apikeys`) returning `{ success, keys: [{ id, name, start, createdAt, expiresAt }] }` with dates as ISO strings (`expiresAt` `null` when the key does not expire);
- `v0.apiKey.create` (`POST /api/v0/apikeys`) with a non-empty `name`, returning `{ success, key, id, name }`, where `key` is the full secret;
- `v0.apiKey.remove` (`DELETE /api/v0/apikeys`) with the key `id`.

The full key SHALL only appear in the create response; listings SHALL expose only its first characters (`start`).

#### Scenario: Create a key

- **WHEN** a signed-in user calls `v0.apiKey.create` with `name: "github"`
- **THEN** the response SHALL contain the full key, and later listings SHALL show the key by name and `start` only

#### Scenario: Revoked key stops working

- **WHEN** a key is removed with `v0.apiKey.remove` and a pipeline then calls `POST /api/v0/deploy` with it
- **THEN** the deploy SHALL fail with `UNAUTHORIZED`

#### Scenario: Key used to manage keys

- **WHEN** a request authenticated with `x-api-key` calls any `v0.apiKey.*` procedure
- **THEN** it SHALL fail with `FORBIDDEN`

### Requirement: API Keys page

The dashboard SHALL provide an API Keys page at `/keys` listing the user's keys with their name, `start` followed by a mask, and creation date, and a key count in the header. A "new key" button SHALL open an inline form asking for a name (focused on open, `Escape` cancels); empty names SHALL NOT be submitted. After creating a key, the page SHALL show the full key once, in a panel with a copy button, a warning that it will not be shown again, and the deploy `curl` snippet with that key filled in, until dismissed. Deleting a key SHALL require a second click within 3 seconds and SHALL remove the row optimistically, restoring it if the call fails. The page SHALL show skeletons while loading, an empty state with a create button and an error state with retry.

#### Scenario: Copy a new key

- **WHEN** the user creates a key named `gitea`
- **THEN** the page SHALL show the full key with a copy button and a `curl` command that already contains it

#### Scenario: Failed delete

- **WHEN** the user confirms deleting a key and the call fails
- **THEN** the key SHALL reappear in the list and an error toast SHALL be shown
