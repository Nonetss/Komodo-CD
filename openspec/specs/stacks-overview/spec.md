# Stacks Overview

## Purpose

Lists every stack of the connected Komodo instance in a master–detail Stacks page with a URL per stack (`/stacks/<name>`): its state, services, images and pending updates, and pull/redeploy actions on one stack or on a selection of several.

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

The dashboard SHALL provide a Stacks page at `/stacks` and `/stacks/<name>`. The page SHALL be master–detail:

- a **list pane** with every stack;
- a **detail pane** for the stack named in the URL.

The list pane SHALL show a header with the total and a count of running stacks. It SHALL be sorted by name and filterable:

- by a text search on the name, cleared with `Escape` or a clear button;
- by a group, each with its count: all; running (`running`, `deploying`); stopped (`stopped`, `down`, `paused`, `created`); problems (a danger state — `unhealthy`, `dead`, `removing` —, `unknown`, `project_missing` or missing files).

Each list item SHALL show:

- a state dot, coloured by state and pulsing for `deploying` and `restarting`;
- the stack name and the service count;
- a problem marker when the stack has a problem;
- an update marker when any service image has an update or the deployed commit differs from the latest one;
- a running indicator while an action runs on it.

Clicking an item SHALL navigate to `/stacks/<name>`, and the item of the open stack SHALL be highlighted and marked `aria-current="page"`. Moving between stacks SHALL keep the search, the group and the selection, and browser back and forward SHALL move between the visited stacks. At `/stacks` with no name, the detail pane SHALL invite the user to pick a stack. On small screens:

- `/stacks` SHALL show only the list;
- `/stacks/<name>` SHALL show only the detail, with a link back to the list.

#### Scenario: Filter by problems

- **WHEN** the user selects the problems group
- **THEN** only stacks in a danger or unknown state, with a missing project or with missing files SHALL be listed

#### Scenario: Nothing matches

- **WHEN** the search and group leave no stack
- **THEN** the list pane SHALL show a no-match state with a button that clears both filters

#### Scenario: Move between stacks

- **WHEN** the user has searched "git", selected `api` and then clicks `gitea` in the list
- **THEN** the URL SHALL become `/stacks/gitea`, the detail pane SHALL show `gitea`, and the search and the selection of `api` SHALL be kept

#### Scenario: Back to the previous stack

- **WHEN** the user opened `/stacks/web`, then clicked `api`, then pressed the browser's back button
- **THEN** the detail pane SHALL show `web` again

### Requirement: Stack details

The detail pane SHALL show the stack named in the URL:

- its name, state and service count;
- the repository (linked when Komodo gives a link) and branch;
- the action buttons;
- the problem message (missing project, or the list of missing files) when there is one;
- for a stack backed by a git repository, the deployed commit and the latest commit, the latter marked when it differs (Komodo gives no commits for other stacks, so they are omitted);
- a table with every service: its name, its image reference (registry dimmed, name, tag or a shortened digest; the full reference in the tooltip) and whether a newer image is available;
- the CI `curl` snippet with a selector for the action.

When the name in the URL matches no stack of `v0.stacks.list`, the detail pane SHALL show a not-found state with a link to `/stacks`.

#### Scenario: Open a stack

- **WHEN** the user opens `/stacks/web`
- **THEN** the detail pane SHALL show the services, commits and CI snippet of `web`, and the `web` item SHALL carry `aria-current="page"`

#### Scenario: Unknown stack

- **WHEN** the user opens `/stacks/ghost` and no stack is named `ghost`
- **THEN** the detail pane SHALL show the not-found state with a link to `/stacks` while the list pane stays usable

### Requirement: Select several stacks

Each item of the list pane SHALL have a checkbox, labelled with the stack name, that adds the stack to or removes it from the selection without opening it. Above the list, a "select all" checkbox SHALL:

- select every stack shown by the current search and group when not all of them are selected, and deselect them otherwise;
- be indeterminate when only some of the shown stacks are selected.

The selection SHALL be kept by stack name across search, group and open-stack changes. A stack that disappears from `v0.stacks.list` SHALL leave the selection.

#### Scenario: Select two stacks

- **WHEN** the user ticks the checkboxes of `web` and `api`
- **THEN** both stacks SHALL be selected and the URL SHALL not change

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

While at least one stack is selected, the Stacks page SHALL show a bulk action bar with:

- the number of selected stacks, and how many of them the current filters hide when any;
- one button per action (`pull`, `redeploy`, `pull-redeploy`);
- a button that clears the selection.

Clicking an action SHALL first ask for an inline confirmation naming the action and the number of stacks; cancelling SHALL do nothing. On confirmation, the page SHALL call `v0.deploy.trigger` once per selected stack with that action, at most three calls at a time. While its call runs, each stack SHALL show its running indicator and, when it is the open stack, the spinner and disabled buttons exactly as for a single action.

The bulk actions SHALL be disabled while a bulk run is in progress or while any selected stack already has an action running, including one reported by the live deploy subscription.

When every call has settled, the page SHALL show one summary toast instead of one toast per stack: success when all succeeded, otherwise an error naming the failed stacks. Succeeded stacks SHALL leave the selection and failed ones SHALL stay selected. The stacks and history queries SHALL be refreshed.

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

#### Scenario: Selected stack deployed elsewhere

- **WHEN** `web` and `api` are selected and a pipeline starts a deploy of `api`
- **THEN** the bulk actions SHALL be disabled until that deploy finishes

### Requirement: Empty and error states

When `v0.stacks.list` fails, the Stacks page SHALL show an error state with the backend message, a retry button and a link to `/credentials`. When it succeeds with no stacks, it SHALL show an empty state linking to `/credentials`. While loading, the list pane SHALL show skeleton items and the detail pane a skeleton of the stack.

#### Scenario: Komodo not configured

- **WHEN** the stacks query fails with `503`
- **THEN** the page SHALL show the error state with the message and a link to configure the connection

### Requirement: Run actions on a stack

The detail pane SHALL offer one button per action (`pull`, `redeploy`, `pull-redeploy`) that calls `v0.deploy.trigger` for the open stack.

While an action runs on a stack, that stack SHALL show it in two places:

- its action buttons SHALL be disabled, and the running one SHALL show a spinner;
- its list item SHALL show the running indicator.

Other stacks SHALL stay usable. An action counts as running on a stack both when this page started it and when the live deploy subscription reports it in flight (started by CI, another user or another tab).

The outcome of an action started from this page SHALL be reported with a success or error toast carrying the backend message, and the stacks and history queries SHALL be refreshed. When the live deploy subscription reports that any deploy finished, the stacks and history queries SHALL be refreshed without a toast.

#### Scenario: Redeploy from the detail pane

- **WHEN** the user opens `/stacks/web` and clicks redeploy
- **THEN** the page SHALL call `v0.deploy.trigger` with `{ stack: "web", action: "redeploy" }` and show a toast with the result

#### Scenario: Deploy started by CI

- **WHEN** `/stacks/web` is open and a pipeline triggers a redeploy of `web`
- **THEN** the redeploy button of `web` SHALL show a spinner, its action buttons SHALL be disabled and its list item SHALL show the running indicator until the deploy finishes, and then the stacks list SHALL be refreshed without a toast

