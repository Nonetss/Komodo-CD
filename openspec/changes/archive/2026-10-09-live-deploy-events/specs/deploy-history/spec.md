## MODIFIED Requirements

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
