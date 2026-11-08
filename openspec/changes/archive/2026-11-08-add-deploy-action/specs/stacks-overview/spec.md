## MODIFIED Requirements

### Requirement: Stack details

The detail pane SHALL show the stack named in the URL:

- its name, state and service count;
- the repository (linked when Komodo gives a link) and branch;
- the action buttons, led by the delete button (see "Delete a stack"); Pull + Redeploy carries its label, while Pull, Redeploy and delete show only their icon, with the label as tooltip and accessible name;
- the problem message (missing project, or the list of missing files) when there is one;
- for a stack backed by a git repository, the deployed commit and the latest commit, the latter marked when it differs (Komodo gives no commits for other stacks, so they are omitted);
- a table with every service: its name, its image reference (registry dimmed, name, tag or a shortened digest; the full reference in the tooltip) and whether a newer image is available;
- a security section with the stack's images as on the Security page: their vulnerability counts per severity, how many are fixable, the scan state, a rescan button when scanning is enabled, and each image expandable in place into its CVEs. Other stacks that share an image are linked from its row; the open stack is not repeated. The section links to `/security` and is omitted when the stack declares no image;
- the CI snippet (see "CI snippet" in `deployment`), as `curl` or as a GitHub Action step, with a selector for the action.

When the name in the URL matches no stack of `v0.stacks.list`, the detail pane SHALL show a not-found state with a link to `/stacks`.

#### Scenario: Open a stack

- **WHEN** the user opens `/stacks/web`
- **THEN** the detail pane SHALL show the services, commits and CI snippet of `web`, and the `web` item SHALL carry `aria-current="page"`

#### Scenario: Unknown stack

- **WHEN** the user opens `/stacks/ghost` and no stack is named `ghost`
- **THEN** the detail pane SHALL show the not-found state with a link to `/stacks` while the list pane stays usable
