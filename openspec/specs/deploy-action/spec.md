# Deploy Action

## Purpose

A reusable GitHub Action that pipelines use to pull and/or redeploy a Komodo stack through Komodo CD's `POST /api/v0/deploy`, so a deploy step takes four inputs instead of a hand-written `curl`.

## Requirements

### Requirement: Action inputs

The repository root SHALL contain a composite action (`action.yml`) usable as `uses: <owner>/Komodo-CD@<ref>`, with the inputs `url` (required, the public URL of Komodo CD), `api-key` (required, an API key created in the dashboard), `stack` (required, the Komodo stack name) and `action` (optional, `pull`, `redeploy` or `pull-redeploy`, default `pull-redeploy`). It SHALL run on the runner with `bash` and `curl` only, without a container image, so it works on GitHub-hosted runners and in Gitea Actions. It SHALL NOT expand any input inside the shell script's text: inputs SHALL reach the script only as environment variables.

#### Scenario: Default action

- **WHEN** a workflow uses the action with `url`, `api-key` and `stack: web` and no `action`
- **THEN** the action SHALL request a `pull-redeploy` of `web`

#### Scenario: Stack name with shell or JSON characters

- **WHEN** `stack` contains `"`, `\`, `$(…)` or backticks
- **THEN** no shell command SHALL run from it, and the request body SHALL carry it as a valid JSON string

### Requirement: Input validation

Before sending anything, the action SHALL fail the step with an error annotation when `url`, `api-key` or `stack` is empty, when `url` does not start with `http://` or `https://`, or when `action` is not one of `pull`, `redeploy` or `pull-redeploy`. A trailing `/` in `url` SHALL be ignored.

#### Scenario: Unknown action

- **WHEN** the action runs with `action: restart`
- **THEN** the step SHALL fail without calling Komodo CD and name the valid actions

#### Scenario: Trailing slash

- **WHEN** `url` is `https://deploy.example.com/`
- **THEN** the request SHALL go to `https://deploy.example.com/api/v0/deploy`

### Requirement: Deploy request and result

The action SHALL send `POST <url>/api/v0/deploy` with the `x-api-key` header and the JSON body `{"stack": <stack>, "action": <action>}`, and wait for the answer without a client-side timeout, since Komodo CD answers only when Komodo has finished. It SHALL expose the outputs `status` (the HTTP status code) and `message` (the `message` of the answer, or its raw body when it has none). On a `2xx` answer the step SHALL succeed and log the message. On any other answer it SHALL fail with an error annotation that contains the status and the message. When the request cannot be made (DNS, TLS, connection refused) it SHALL fail with curl's error. The API key SHALL never be printed in the log.

#### Scenario: Successful deploy

- **WHEN** Komodo CD answers `200` with `{"success":true,"message":"Acción 'pull-redeploy' completada para 'web'",…}`
- **THEN** the step SHALL succeed, log that message and set `status` to `200`

#### Scenario: Komodo rejects the action

- **WHEN** Komodo CD answers `502` with Komodo's message
- **THEN** the step SHALL fail with an error annotation containing `502` and that message

#### Scenario: Invalid API key

- **WHEN** Komodo CD answers `401`
- **THEN** the step SHALL fail
