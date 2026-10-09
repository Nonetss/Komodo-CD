# Stacks Overview

## Purpose

Lists every stack of the connected Komodo instance with its state, services, images and pending updates, and lets a user run pull/redeploy actions on one stack or on a selection of several from the Stacks page, the dashboard's landing page.

## Requirements

### Requirement: List Komodo stacks

The system SHALL expose `v0.stacks.list` as a `protectedProcedure` (`GET /api/v0/stacks`, tag `Stacks`) returning `{ success, stacks }`, where `stacks` is the result of Komodo's `ListStacks` requested with `limit: 0` so that Komodo v2 returns every stack instead of its default page. Each item SHALL be validated against a loose schema mirroring `StackListItem` (`id`, `type`, `name`, `template`, `tags`, `info` with `state`, `status`, `services[{ service, image, update_available }]`, repo fields, `project_missing`, `missing_files`, `deployed_hash`, `latest_hash`): unknown fields from newer Komodo versions SHALL be passed through, and optional fields SHALL accept `null`. Komodo errors SHALL become `502` and a missing connection `503` (`toKomodoError`).

#### Scenario: More than one page of stacks

- **WHEN** the Komodo v2 instance holds more stacks than its default pagination limit
- **THEN** `v0.stacks.list` SHALL return all of them

#### Scenario: Newer Komodo fields

- **WHEN** Komodo returns a stack with a field the schema does not declare (e.g. `swarm_id`)
- **THEN** the item SHALL be returned with that field instead of failing validation

#### Scenario: CI lists stacks

- **WHEN** a request with a valid `x-api-key` calls `GET /api/v0/stacks`
- **THEN** the system SHALL answer `200` with the stacks

### Requirement: Stacks page

The dashboard SHALL provide a Stacks page at `/stacks`, the target of `/` and of the logo link. It SHALL show a header with counts of running stacks, stacks with problems (only when there are any) and the total, and a refresh button. The list SHALL be sorted by name and filterable by a text search on the name (cleared with `Escape` or a clear button) and by a group: all, running (`running`, `deploying`), stopped (`stopped`, `down`, `paused`, `created`) and problems (a danger state — `unhealthy`, `dead`, `removing` —, `unknown`, `project_missing` or missing files), each with its count. Each stack row SHALL show a state dot and label (colour by state, pulsing for `deploying` and `restarting`), the service count, `repo@branch` when there is one, a problem icon and an "update available" tag when any service image has an update or the deployed commit differs from the latest one.

#### Scenario: Filter by problems

- **WHEN** the user selects the problems group
- **THEN** only stacks in a danger or unknown state, with a missing project or with missing files SHALL be listed

#### Scenario: Nothing matches

- **WHEN** the search and group leave no stack
- **THEN** the page SHALL show a no-match state with a button that clears both filters

### Requirement: Stack details

Expanding a stack row SHALL reveal its details: the problem message (missing project, or the list of missing files), the deployed commit and, when an update exists, the latest commit, the repository (linked when Komodo gives a link) and branch, every service with its image reference (registry dimmed, name, tag or a shortened digest; the full reference in the tooltip) and update tag, and the CI `curl` snippet with a selector for the action. Several rows MAY be expanded at once.

#### Scenario: Expand a stack

- **WHEN** the user clicks the `web` row
- **THEN** its details SHALL appear below it and the row SHALL report `aria-expanded="true"`

### Requirement: Run actions from the list

Each stack row SHALL offer one button per action (`pull`, `redeploy`, `pull-redeploy`) that calls `v0.deploy.trigger` for that stack. While an action runs on a stack, that stack's action buttons SHALL be disabled and the running one SHALL show a spinner; other stacks SHALL stay usable. The outcome SHALL be reported with a success or error toast carrying the backend message, and the stacks and history queries SHALL be refreshed.

#### Scenario: Redeploy from the list

- **WHEN** the user clicks the redeploy button of `web`
- **THEN** the page SHALL call `v0.deploy.trigger` with `{ stack: "web", action: "redeploy" }` and show a toast with the result

### Requirement: Select several stacks

Each stack row on the Stacks page SHALL have a checkbox, labelled with the stack name, that adds the stack to or removes it from the selection without expanding or collapsing the row. Above the list, a "select all" checkbox SHALL select every stack shown by the current search and group when not all of them are selected, and deselect them otherwise; it SHALL be indeterminate when only some of the shown stacks are selected. The selection SHALL be kept by stack name across search and group changes, and a stack that disappears from `v0.stacks.list` SHALL leave the selection.

#### Scenario: Select two stacks

- **WHEN** the user ticks the checkboxes of `web` and `api`
- **THEN** both stacks SHALL be selected and neither row SHALL expand

#### Scenario: Select all shown stacks

- **WHEN** the group "stopped" shows three stacks, none selected, and the user ticks the "select all" checkbox
- **THEN** those three stacks SHALL be selected and stacks outside the group SHALL keep their previous selection state

#### Scenario: Partial selection

- **WHEN** one of the three shown stacks is selected
- **THEN** the "select all" checkbox SHALL be indeterminate

#### Scenario: Selected stack is removed in Komodo

- **WHEN** a selected stack no longer appears after the stacks query refreshes
- **THEN** it SHALL be removed from the selection

### Requirement: Run an action on the selected stacks

While at least one stack is selected, the Stacks page SHALL show a bulk action bar with the number of selected stacks (and how many of them the current filters hide, when any), one button per action (`pull`, `redeploy`, `pull-redeploy`) and a button that clears the selection. Clicking an action SHALL first ask for an inline confirmation naming the action and the number of stacks; cancelling SHALL do nothing. On confirmation the page SHALL call `v0.deploy.trigger` once per selected stack with that action, at most three calls at a time, each row showing its spinner and disabled buttons while its call runs exactly as for a single action. The bulk actions SHALL be disabled while a bulk run is in progress or while any selected stack already has an action running. When every call has settled, the page SHALL show one summary toast — success when all succeeded, error naming the failed stacks otherwise — instead of one toast per stack; succeeded stacks SHALL leave the selection and failed ones SHALL stay selected. The stacks and history queries SHALL be refreshed.

#### Scenario: Redeploy three stacks

- **WHEN** `web`, `api` and `db` are selected and the user chooses redeploy and confirms
- **THEN** the page SHALL call `v0.deploy.trigger` with `{ stack, action: "redeploy" }` for each of the three stacks and, when all succeed, show one success toast and clear the selection

#### Scenario: Partial failure

- **WHEN** a bulk pull on `web` and `api` succeeds for `web` and fails for `api`
- **THEN** the page SHALL show one error toast naming `api`, and only `api` SHALL remain selected

#### Scenario: Cancel the confirmation

- **WHEN** the user chooses an action in the bulk bar and then cancels the confirmation
- **THEN** no request SHALL be sent and the selection SHALL stay as it was

#### Scenario: Concurrency limit

- **WHEN** a bulk action runs on eight selected stacks
- **THEN** no more than three `v0.deploy.trigger` calls SHALL be in flight at the same time

#### Scenario: Clear the selection

- **WHEN** the user clicks the clear button of the bulk bar
- **THEN** no stack SHALL be selected and the bar SHALL disappear

### Requirement: Empty and error states

When `v0.stacks.list` fails, the page SHALL show an error state with the backend message, a retry button and a link to `/credentials`. When it succeeds with no stacks, it SHALL show an empty state linking to `/credentials`. While loading, it SHALL show skeleton rows.

#### Scenario: Komodo not configured

- **WHEN** the stacks query fails with `503`
- **THEN** the page SHALL show the error state with the message and a link to configure the connection
