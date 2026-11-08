## MODIFIED Requirements

### Requirement: API Keys page

The dashboard SHALL provide an API Keys page at `/keys` listing the user's keys with their name, `start` followed by a mask, and creation date, and a key count in the header. A "new key" button SHALL open an inline form asking for a name (focused on open, `Escape` cancels); empty names SHALL NOT be submitted. After creating a key, the page SHALL show the full key once, in a panel with a copy button, a warning that it will not be shown again, and the deploy CI snippet (see "CI snippet" in `deployment`), whose `curl` format has that key filled in, until dismissed. Deleting a key SHALL require a second click within 3 seconds and SHALL remove the row optimistically, restoring it if the call fails. The page SHALL show skeletons while loading, an empty state with a create button and an error state with retry.

#### Scenario: Copy a new key

- **WHEN** the user creates a key named `gitea`
- **THEN** the page SHALL show the full key with a copy button and a `curl` command that already contains it

#### Scenario: Failed delete

- **WHEN** the user confirms deleting a key and the call fails
- **THEN** the key SHALL reappear in the list and an error toast SHALL be shown
