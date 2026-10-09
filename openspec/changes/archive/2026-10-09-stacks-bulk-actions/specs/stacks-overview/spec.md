## ADDED Requirements

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
