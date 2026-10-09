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

The system SHALL expose `v0.history.list` as a `protectedProcedure` (`GET /api/v0/history`, tag `History`) returning the 100 most recent rows, newest first, as `{ success, history: [{ id, userId, userName, userEmail, via, actorName, stack, action, success, message, createdAt }] }` with `createdAt` as an ISO string and missing optional values as `null`. `via` SHALL be `apiKey` when the stored `user_email` is empty and the stored `user_name` follows the API key actor convention (`API Key` or `API Key: <key name>`), and `session` otherwise. `actorName` SHALL be the key name for an API key actor (`null` when the key had no name) and, for a session actor, the stored name, else the email, else the user id. The API key convention SHALL be defined once in `packages/auth` and used both to write the name and to read it back.

#### Scenario: More than 100 entries

- **WHEN** the table holds 150 rows and `v0.history.list` is called
- **THEN** the response SHALL contain the 100 newest rows ordered by `createdAt` descending

#### Scenario: CI reads the history

- **WHEN** a request with a valid `x-api-key` calls `GET /api/v0/history`
- **THEN** the system SHALL answer `200` with the history

#### Scenario: Entry from a named API key

- **WHEN** a row has `user_name` `API Key: github` and an empty `user_email`
- **THEN** its entry SHALL have `via` `apiKey` and `actorName` `github`

#### Scenario: User whose name looks like a key

- **WHEN** a row has `user_name` `API Keyes` and `user_email` `keyes@example.com`
- **THEN** its entry SHALL have `via` `session` and `actorName` `API Keyes`

#### Scenario: Entry from an unnamed API key

- **WHEN** a row has `user_name` `API Key` and an empty `user_email`
- **THEN** its entry SHALL have `via` `apiKey` and `actorName` `null`

#### Scenario: Entry from a signed-in user

- **WHEN** a row has `user_name` `Ana` and `user_email` `ana@example.com`
- **THEN** its entry SHALL have `via` `session` and `actorName` `Ana`

#### Scenario: Session entry without name

- **WHEN** a row has no `user_name` and `user_email` `ana@example.com`
- **THEN** its entry SHALL have `via` `session` and `actorName` `ana@example.com`

### Requirement: List the activity

The system SHALL expose `v0.history.activity` as a `protectedProcedure` (`GET /api/v0/history/activity`, tag `History`) taking `days` (an integer from 1 to 90, 30 when omitted; other values SHALL be rejected) and returning `{ success, since, truncated, events: [{ stack, action, success, via, createdAt }] }`: the rows created in the last `days` days, newest first, with `since` the start of the window and `createdAt` as ISO strings and `via` derived as in `v0.history.list`. It SHALL return at most 10,000 events, with `truncated` set when there were more.

#### Scenario: Default window

- **WHEN** rows exist 31 days, 7 days and 2 hours ago and `v0.history.activity` is called without `days`
- **THEN** the response SHALL contain the rows of 2 hours and 7 days ago, in that order, and `truncated` SHALL be `false`

#### Scenario: Window out of range

- **WHEN** `v0.history.activity` is called with `days` 0 or 91
- **THEN** the system SHALL reject the input

### Requirement: History page

The dashboard SHALL provide a History page at `/history` showing the entries as a timeline grouped into last hour, today, last week and older, each entry with a success or failure mark, the stack, the translated action label, a relative time (full date and time in its tooltip, formatted in the UI language), the message (in the danger tone for failures) and the actor. The actor SHALL be taken from `via` and `actorName`: an API key actor SHALL be marked with a key icon and show the key name, or a translated "API key" label when `actorName` is `null`; a session actor SHALL show `actorName` with a user icon. A filter SHALL switch between all, successful and failed entries, each with its count. The page SHALL have a refresh button, a skeleton while loading, an empty state and an error state with retry. While open, the page SHALL use the live deploy subscription so that the history is refreshed whenever any deploy finishes, wherever it was triggered.

#### Scenario: Only failures

- **WHEN** the user selects the failed filter
- **THEN** only entries with `success: false` SHALL be shown, still grouped by time

#### Scenario: New deploy refreshes the history

- **WHEN** a deploy is triggered from the Deploy or Stacks page
- **THEN** the cached history query SHALL be invalidated so the History page shows the new entry

#### Scenario: Unnamed API key actor

- **WHEN** an entry has `via` `apiKey` and `actorName` `null` and the page is in Spanish
- **THEN** the actor SHALL show the key icon and the Spanish "API key" label from the dictionary

#### Scenario: CI deploy appears live

- **WHEN** the History page is open and a pipeline's deploy finishes
- **THEN** the new entry SHALL appear without the user pressing refresh
