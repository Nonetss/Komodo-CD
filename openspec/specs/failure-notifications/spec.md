# Failure Notifications

## Purpose

Sends an ntfy push notification when a deploy fails, so nobody has to watch the CI logs. A signed-in user configures the ntfy server, topic and optional access token, pauses or resumes the alerts, and sends test notifications from the Credentials page.

## Requirements

### Requirement: Single ntfy configuration

The ntfy target SHALL be stored in the `ntfy` table (`url`, `topic`, optional `token`, `enabled` defaulting to `true`, timestamps), with at most one row in practice: saving when a row exists SHALL update it.

#### Scenario: Save twice

- **WHEN** the ntfy configuration is saved twice with different topics
- **THEN** the table SHALL hold one row with the latest topic

### Requirement: Manage the configuration through the API

The system SHALL expose, as `sessionProcedure`s under the `Credentials` tag:

- `v0.credentials.ntfy.get` (`GET /api/v0/deploy/credentials/ntfy`) returning `{ success, config: { url, topic, hasToken, enabled } | null }`;
- `v0.credentials.ntfy.save` (`POST /api/v0/deploy/credentials/ntfy`) with `{ url, topic, token?, enabled = true }`;
- `v0.credentials.ntfy.remove` (`DELETE /api/v0/deploy/credentials/ntfy`);
- `v0.credentials.ntfy.test` (`POST /api/v0/deploy/credentials/ntfy/test`).

`url` SHALL be a valid URL and `topic` SHALL match `^[-_A-Za-z0-9]{1,64}$`. The token SHALL never be returned; only `hasToken`. On save, an omitted `token` SHALL keep the stored one and an empty string SHALL remove it.

#### Scenario: Token is hidden

- **WHEN** a configuration with a token is saved and `v0.credentials.ntfy.get` is called
- **THEN** the response SHALL include `hasToken: true` and no token value

#### Scenario: Keep the token on edit

- **WHEN** the configuration is saved again without a `token` field
- **THEN** the previously stored token SHALL be kept

#### Scenario: Clear the token

- **WHEN** the configuration is saved with `token: ""`
- **THEN** the stored token SHALL be removed

#### Scenario: Invalid topic

- **WHEN** `v0.credentials.ntfy.save` is called with a topic containing a space or longer than 64 characters
- **THEN** the system SHALL reject it as `BAD_REQUEST`

### Requirement: Publishing to ntfy

Notifications SHALL be published as JSON (`{ topic, title, message, priority?, tags? }`) with `POST` to the server's root URL (trailing slashes removed), with `Authorization: Bearer <token>` when a token is set, and SHALL be aborted after 5 seconds. A non-2xx answer SHALL be reported as an error that includes the status and ntfy's `error` text when present.

#### Scenario: Protected topic

- **WHEN** the configuration has a token and a notification is published
- **THEN** the request SHALL carry `Authorization: Bearer <token>`

#### Scenario: ntfy does not answer

- **WHEN** the ntfy server does not answer within 5 seconds
- **THEN** the publish SHALL be aborted and reported as failed

### Requirement: Alert on failed deploys

When a deploy fails and the stored configuration is enabled, the system SHALL publish a notification titled `Deploy fallido: <stack>`, whose message names the action, the actor and Komodo's error, with priority `4` and the tags `rotating_light` and the stack name. Without a configuration, or with alerts paused (`enabled: false`), nothing SHALL be sent. A publishing error SHALL only be logged; it SHALL NOT be thrown to the deploy.

#### Scenario: Alerts paused

- **WHEN** a deploy fails and the configuration has `enabled: false`
- **THEN** no notification SHALL be published

#### Scenario: ntfy is down during a failed deploy

- **WHEN** a deploy fails and publishing to ntfy also fails
- **THEN** the error SHALL be logged and the deploy SHALL still answer with its own Komodo error

### Requirement: Test notifications

`v0.credentials.ntfy.test` SHALL publish a test notification. Without a body it SHALL use the stored configuration; with a body (`{ url, topic, token? }`) it SHALL use that target, taking the stored token when `token` is omitted, so a form can be tested before saving. With neither a body nor a stored configuration, or when publishing fails, it SHALL fail with `BAD_REQUEST` and the reason.

#### Scenario: Test before saving

- **WHEN** a user fills the ntfy form and clicks test without saving
- **THEN** the system SHALL publish the test notification to the typed URL and topic

#### Scenario: Nothing to test

- **WHEN** `v0.credentials.ntfy.test` is called without a body and no configuration is stored
- **THEN** the call SHALL fail with `BAD_REQUEST`

### Requirement: Notifications section

The Credentials page SHALL include an ntfy section. Without a configuration it SHALL show an empty state with an add button. With one it SHALL show the URL, topic, whether a token is set and whether alerts are active, with actions to pause or resume, send a test, edit and delete (delete confirmed by a second click within 3 seconds). The form SHALL default the URL to `https://ntfy.sh`, validate URL and topic on the client, and leave the token field empty, sending no token (keep) when one is stored and the field is untouched.

#### Scenario: Pause alerts

- **WHEN** the user clicks pause on an active configuration
- **THEN** the page SHALL save it with `enabled: false` and show that alerts are paused
