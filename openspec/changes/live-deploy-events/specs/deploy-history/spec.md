## MODIFIED Requirements

### Requirement: History page

The dashboard SHALL provide a History page at `/history` showing the entries as a timeline grouped into last hour, today, last week and older, each entry with a success or failure mark, the stack, the translated action label, a relative time (full date and time in its tooltip, formatted in the UI language), the message (in the danger tone for failures) and the actor, marked with a key icon and the key name when it came from an API key. A filter SHALL switch between all, successful and failed entries, each with its count. The page SHALL have a refresh button, a skeleton while loading, an empty state and an error state with retry. While open, the page SHALL use the live deploy subscription so that the history is refreshed whenever any deploy finishes, wherever it was triggered.

#### Scenario: Only failures

- **WHEN** the user selects the failed filter
- **THEN** only entries with `success: false` SHALL be shown, still grouped by time

#### Scenario: New deploy refreshes the history

- **WHEN** a deploy is triggered from the Deploy or Stacks page
- **THEN** the cached history query SHALL be invalidated so the History page shows the new entry

#### Scenario: CI deploy appears live

- **WHEN** the History page is open and a pipeline's deploy finishes
- **THEN** the new entry SHALL appear without the user pressing refresh
