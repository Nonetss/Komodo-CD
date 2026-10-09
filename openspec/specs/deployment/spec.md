# Deployment

## Purpose

Turns a request from a person or a CI pipeline into a pull and/or redeploy of a stack on the configured Komodo instance, records the outcome in the action history and alerts through ntfy when it fails. Covers the `v0.deploy.trigger` procedure (`POST /api/v0/deploy`) and the dashboard's Deploy page.

## Requirements

### Requirement: Trigger a deploy action on a stack

The system SHALL expose `v0.deploy.trigger` as a `protectedProcedure`, reachable over oRPC and as `POST /api/v0/deploy`. Its input SHALL be `{ stack, action }`, where `stack` is a non-empty Komodo stack name and `action` is one of `pull`, `redeploy` or `pull-redeploy`. `pull` SHALL run Komodo's `PullStack`, `redeploy` SHALL run `DeployStack`, and `pull-redeploy` SHALL run `PullStack` and then, only if the pull succeeded, `DeployStack`. On success it SHALL return `{ success: true, message, stack, action }`, where `message` names the action and the stack.

#### Scenario: CI pulls and redeploys a stack

- **WHEN** a request with a valid `x-api-key` sends `POST /api/v0/deploy` with `{"stack":"web","action":"pull-redeploy"}`
- **THEN** the system SHALL pull the `web` stack, then redeploy it, and answer `200` with `success: true`

#### Scenario: Pull only

- **WHEN** `v0.deploy.trigger` is called with `action: "pull"`
- **THEN** the system SHALL run `PullStack` and SHALL NOT run `DeployStack`

#### Scenario: Invalid action

- **WHEN** the input's `action` is not one of `pull`, `redeploy` or `pull-redeploy`, or `stack` is empty
- **THEN** the system SHALL reject the request as `BAD_REQUEST` without contacting Komodo

#### Scenario: Anonymous caller

- **WHEN** a request without a session cookie or a valid `x-api-key` calls `v0.deploy.trigger`
- **THEN** the system SHALL reject it as `UNAUTHORIZED` (`401`)

### Requirement: Komodo failures map to gateway errors

When Komodo answers with an error or cannot be reached, `v0.deploy.trigger` SHALL fail with `BAD_GATEWAY` (`502`) whose message is Komodo's own error text (`result.error` of the `komodo_client` failure, or the `Error` message). When no Komodo connection is configured, it SHALL fail with `SERVICE_UNAVAILABLE` (`503`). Both conversions SHALL go through `toKomodoError` in `packages/api/src/lib/komodo.ts`.

#### Scenario: Komodo rejects the stack

- **WHEN** Komodo answers the pull with `{ status: 404, result: { error: "stack not found" } }`
- **THEN** the call SHALL fail with `BAD_GATEWAY` and the message `stack not found`

#### Scenario: No connection configured

- **WHEN** `v0.deploy.trigger` is called and no complete Komodo connection is stored
- **THEN** the call SHALL fail with `SERVICE_UNAVAILABLE`

### Requirement: Every attempt is recorded in the history

Every call to `v0.deploy.trigger` that reaches the handler SHALL insert one row in `action_history` with the caller's user id, name and email, the stack, the action, whether it succeeded and the resulting message (the success message, or Komodo's error text). A failure to write the history row SHALL be logged and SHALL NOT change the response of the deploy.

#### Scenario: Successful deploy is recorded

- **WHEN** a `pull-redeploy` of `web` succeeds
- **THEN** `action_history` SHALL contain a row for `web` with action `pull-redeploy` and `success: true`

#### Scenario: Failed deploy is recorded

- **WHEN** Komodo rejects the deploy with an error message
- **THEN** `action_history` SHALL contain a row with `success: false` and that message

### Requirement: Failed deploys raise an alert

When a deploy fails, the system SHALL ask the ntfy service to notify the failure with the stack, the action, Komodo's error message and the caller's display name (name, else email, else id), before answering the request. The notification SHALL never make the deploy request fail or hang longer than the ntfy publish timeout (see `failure-notifications`).

#### Scenario: Komodo failure with alerts enabled

- **WHEN** a deploy fails and an enabled ntfy configuration exists
- **THEN** the system SHALL publish a failure notification and still answer with the `502` error

### Requirement: Deploy page

The dashboard SHALL provide a Deploy page at `/deploy` with a form to choose a stack and an action and launch it through `v0.deploy.trigger`. The stack field SHALL be an accessible combobox (`role="combobox"`, keyboard navigation with arrows, `Enter` and `Escape`) that suggests the stacks from `v0.stacks.list`, sorted by name, filtered by the typed text and showing each stack's state; free text SHALL also be accepted. The action SHALL be chosen among the three actions, defaulting to `pull-redeploy`. Submitting with an empty stack SHALL show a required-field error and SHALL NOT call the API. The result SHALL be shown inline and as a toast, and after every attempt the history and stacks queries SHALL be invalidated. The submit button SHALL stay disabled until the island has hydrated and while a deploy is running.

#### Scenario: Launch a deploy from the dashboard

- **WHEN** a signed-in user selects stack `web`, action `redeploy` and submits
- **THEN** the page SHALL call `v0.deploy.trigger` with `{ stack: "web", action: "redeploy" }` and show the returned message as a success

#### Scenario: Komodo error in the dashboard

- **WHEN** the deploy fails
- **THEN** the page SHALL show the backend's error message inline in the danger tone and in an error toast

#### Scenario: Empty stack

- **WHEN** the user submits the form without a stack name
- **THEN** the field SHALL be marked invalid with the required message and no request SHALL be sent

### Requirement: CI snippet

The Deploy page, each expanded stack on the Stacks page and the freshly created API key panel SHALL show a ready-to-copy `curl` command for `POST <app-url>/api/v0/deploy` with the headers `x-api-key` and `Content-Type: application/json` and the JSON body `{"stack":…,"action":…}`, built by `buildDeployCurl`. The URL SHALL be `PUBLIC_APP_URL` when it was set at build time, otherwise the browser's origin after hydration. Unless a real key is being shown, the key SHALL be the placeholder `<api-key>`, and a hint SHALL link to the API Keys page.

#### Scenario: Snippet follows the form

- **WHEN** the user types stack `api` and picks `pull` on the Deploy page
- **THEN** the snippet SHALL read `curl -X POST <app-url>/api/v0/deploy` with body `{"stack":"api","action":"pull"}`
