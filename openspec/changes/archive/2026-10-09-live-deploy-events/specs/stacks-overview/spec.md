## MODIFIED Requirements

### Requirement: Run actions from the list

Each stack row SHALL offer one button per action (`pull`, `redeploy`, `pull-redeploy`) that calls `v0.deploy.trigger` for that stack. While an action runs on a stack, that stack's action buttons SHALL be disabled and the running one SHALL show a spinner; other stacks SHALL stay usable. An action counts as running on a stack both when this page started it and when the live deploy subscription reports it in flight (started by CI, another user or another tab). The outcome of an action started from this page SHALL be reported with a success or error toast carrying the backend message, and the stacks and history queries SHALL be refreshed. When the live deploy subscription reports that any deploy finished, the stacks and history queries SHALL be refreshed without a toast.

#### Scenario: Redeploy from the list

- **WHEN** the user clicks the redeploy button of `web`
- **THEN** the page SHALL call `v0.deploy.trigger` with `{ stack: "web", action: "redeploy" }` and show a toast with the result

#### Scenario: Deploy started by CI

- **WHEN** the Stacks page is open and a pipeline triggers a redeploy of `web`
- **THEN** the redeploy button of `web` SHALL show a spinner and its action buttons SHALL be disabled until the deploy finishes, and then the stacks list SHALL be refreshed without a toast

### Requirement: Run an action on the selected stacks

While at least one stack is selected, the Stacks page SHALL show a bulk action bar with the number of selected stacks (and how many of them the current filters hide, when any), one button per action (`pull`, `redeploy`, `pull-redeploy`) and a button that clears the selection. Clicking an action SHALL first ask for an inline confirmation naming the action and the number of stacks; cancelling SHALL do nothing. On confirmation the page SHALL call `v0.deploy.trigger` once per selected stack with that action, at most three calls at a time, each row showing its spinner and disabled buttons while its call runs exactly as for a single action. The bulk actions SHALL be disabled while a bulk run is in progress or while any selected stack already has an action running, including one reported by the live deploy subscription. When every call has settled, the page SHALL show one summary toast — success when all succeeded, error naming the failed stacks otherwise — instead of one toast per stack; succeeded stacks SHALL leave the selection and failed ones SHALL stay selected. The stacks and history queries SHALL be refreshed.

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
