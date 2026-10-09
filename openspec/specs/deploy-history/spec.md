# Deploy History

## Purpose

Keeps an audit trail of every deploy action (who, which stack, which action, outcome and message) and shows it as a timeline in the dashboard and through the API.

## Requirements

### Requirement: Action history table

Deploy attempts SHALL be stored in the `action_history` table with an autoincrement `id`, `user_id`, `user_name`, `user_email`, `stack`, `action`, `success`, `message` and `created_at` (defaulting to the insert time), indexed by `created_at`, `stack` and `user_id`. `user_id` SHALL NOT have a foreign key, so the history survives the deletion of the user or of the API key that triggered the action.

#### Scenario: Actor deleted

- **WHEN** the user who triggered a deploy is deleted
- **THEN** that deploy's history row SHALL remain with its stored name and email

### Requirement: API key actors are identifiable

When a deploy is triggered with an API key, the recorded user id SHALL be the key owner's id and the recorded name SHALL be `API Key: <key name>` (or `API Key` when the key has no name), with an empty email.

#### Scenario: Deploy from CI

- **WHEN** a key named `github` triggers a deploy
- **THEN** the history row SHALL have `user_name` `API Key: github`

### Requirement: List the history

The system SHALL expose `v0.history.list` as a `protectedProcedure` (`GET /api/v0/history`, tag `History`) returning the 100 most recent rows, newest first, as `{ success, history: [{ id, userId, userName, userEmail, stack, action, success, message, createdAt }] }` with `createdAt` as an ISO string and missing optional values as `null`.

#### Scenario: More than 100 entries

- **WHEN** the table holds 150 rows and `v0.history.list` is called
- **THEN** the response SHALL contain the 100 newest rows ordered by `createdAt` descending

#### Scenario: CI reads the history

- **WHEN** a request with a valid `x-api-key` calls `GET /api/v0/history`
- **THEN** the system SHALL answer `200` with the history

### Requirement: History page

The dashboard SHALL provide a History page at `/history` showing the entries as a timeline grouped into last hour, today, last week and older, each entry with a success or failure mark, the stack, the translated action label, a relative time (full date and time in its tooltip, formatted in the UI language), the message (in the danger tone for failures) and the actor, marked with a key icon and the key name when it came from an API key. A filter SHALL switch between all, successful and failed entries, each with its count. The page SHALL have a refresh button, a skeleton while loading, an empty state and an error state with retry.

#### Scenario: Only failures

- **WHEN** the user selects the failed filter
- **THEN** only entries with `success: false` SHALL be shown, still grouped by time

#### Scenario: New deploy refreshes the history

- **WHEN** a deploy is triggered from the Deploy or Stacks page
- **THEN** the cached history query SHALL be invalidated so the History page shows the new entry
