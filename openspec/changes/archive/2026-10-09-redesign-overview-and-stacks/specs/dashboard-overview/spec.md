## ADDED Requirements

### Requirement: Overview page

The dashboard SHALL provide an overview page at `/`, the landing page after signing in and the target of the logo link. It SHALL read `v0.stacks.list` and show a header with the page title, a refresh button and four counters: stacks that need attention, stacks with something new to deploy, running stacks (`running`, `deploying`) and the total. The counter of stacks that need attention SHALL use the signal accent when it is greater than zero.

#### Scenario: Landing after sign-in

- **WHEN** a user signs in
- **THEN** they SHALL land on `/` and see the overview

#### Scenario: Counters

- **WHEN** Komodo reports 12 stacks, of which 9 are running, 2 have a problem and 3 others have an update
- **THEN** the header SHALL show 2 needing attention, 3 with something new, 9 running and 12 in total

### Requirement: Stacks grouped by urgency

The overview SHALL place every stack in exactly one numbered section, in this order:

1. **Needs attention**: stacks with a problem (a danger state — `unhealthy`, `dead`, `removing` —, `unknown`, `project_missing` or missing files).
2. **Something new to deploy**: stacks without a problem where any service image has an update or the deployed commit differs from the latest one.
3. **Running**: other stacks in `running` or `deploying`.
4. **Stopped**: the remaining stacks.

Within a section, stacks SHALL be sorted by name. When the first section is empty, it SHALL show a one-line "nothing needs attention" message. When the second is empty, it SHALL show a one-line "everything is up to date" message. The running and stopped sections SHALL be hidden when empty. In every section, each stack name SHALL link to `/stacks/<name>`. Running and stopped stacks SHALL be shown as a compact list with the state dot, the name and the service count, `deploying` labelled as such.

#### Scenario: A stack with a problem and an update

- **WHEN** a stack is `unhealthy` and one of its images has an update
- **THEN** it SHALL appear only in the needs attention section

#### Scenario: Nothing pending

- **WHEN** every stack is running without problems or updates
- **THEN** the needs attention and something new sections SHALL each show their one-line message and every stack SHALL be listed under running

#### Scenario: Open a stack from the overview

- **WHEN** the user clicks `gitea` in any section
- **THEN** the browser SHALL navigate to `/stacks/gitea`

### Requirement: Explain why a stack needs attention

Each stack in the needs attention section SHALL show its state, its service count and `repo@branch`, and one sentence that explains the problem:

- the project is missing on the host, for `project_missing`;
- the missing files, by name, for missing files;
- a container is unhealthy, dead or being removed, for a danger state;
- Komodo cannot report the state, for `unknown`.

A danger or unknown state SHALL offer a redeploy button for that stack. A missing project or missing files SHALL offer no suggested action, because a redeploy cannot fix them. Every row SHALL offer a link to the stack's page.

#### Scenario: Missing files

- **WHEN** `media-tools` reports `compose.override.yaml` as missing
- **THEN** its row SHALL name `compose.override.yaml` and SHALL NOT offer a redeploy button

#### Scenario: Unhealthy stack

- **WHEN** `immich` is `unhealthy`
- **THEN** its row SHALL explain that a container is unhealthy and offer a redeploy button that calls `v0.deploy.trigger` with `{ stack: "immich", action: "redeploy" }`

### Requirement: Show and deploy what is new

Each stack in the something new section SHALL list every service whose image has an update, with its image reference, and the deployed and latest commits when they differ. It SHALL offer one button per action (`pull`, `redeploy`, `pull-redeploy`).

The section header SHALL offer a "pull + redeploy on all N" action. It SHALL first ask for an inline confirmation naming the number of stacks; cancelling SHALL do nothing. On confirmation it SHALL run `pull-redeploy` on every stack of the section with the same rules as the Stacks page bulk run:

- at most three calls at a time;
- one summary toast, success or naming the failed stacks;
- disabled while a run is in progress or while any of those stacks already has an action running.

#### Scenario: Deploy all updates

- **WHEN** the section holds `gitea`, `grafana` and `paperless-ngx` and the user confirms "pull + redeploy on all 3"
- **THEN** the page SHALL call `v0.deploy.trigger` with `action: "pull-redeploy"` for each of the three, never more than three at once, and show one summary toast

#### Scenario: Commit-only update

- **WHEN** a stack has no image update but its latest commit differs from the deployed one
- **THEN** its row SHALL show the deployed and latest commits and no service

### Requirement: Actions and live state on the overview

Every action started from the overview SHALL behave as on the Stacks page:

- While an action runs on a stack, either started here or reported in flight by the live deploy subscription, that stack's buttons SHALL be disabled and the running one SHALL show a spinner.
- A single action SHALL be reported with a toast carrying the backend message.
- The stacks and history queries SHALL be refreshed when an action ends, and when the subscription reports that a deploy finished, in which case without a toast.

#### Scenario: Deploy started by CI

- **WHEN** the overview is open and a pipeline redeploys `immich`
- **THEN** the redeploy button of `immich` SHALL show a spinner until the deploy finishes, and then the overview SHALL refresh without a toast

### Requirement: Overview empty and error states

When `v0.stacks.list` fails, the overview SHALL show the shared error state with the backend message, a retry button and a link to `/credentials`. When there are no stacks, it SHALL show an empty state linking to `/credentials`. While loading, it SHALL show skeletons for the counters and sections.

#### Scenario: Komodo not configured

- **WHEN** the stacks query fails with `503`
- **THEN** the overview SHALL show the error state with the message and a link to configure the connection
