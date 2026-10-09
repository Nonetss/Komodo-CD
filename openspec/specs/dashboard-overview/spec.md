# Dashboard Overview

## Purpose

The overview at `/`: the key figures of the connected Komodo instance in three numbered blocks (stacks, image security and the deployment activity of the last 30 days), followed by the compact lists of running and stopped stacks.

## Requirements
### Requirement: Overview page

The dashboard SHALL provide an overview page at `/`, the landing page after signing in and the target of the logo link. It SHALL read `v0.stacks.list`, `v0.security.list` and `v0.history.activity` (30 days) and show a header with the page title, one refresh button that refetches the three queries, and four counters: stacks that need attention, stacks with something new to deploy, images with critical vulnerabilities and the success rate of the last 30 days. The attention and critical counters SHALL use the signal accent when greater than zero; a counter whose source has not loaded SHALL show `—`.

#### Scenario: Landing after sign-in

- **WHEN** a user signs in
- **THEN** they SHALL land on `/` and see the overview

#### Scenario: Counters

- **WHEN** Komodo reports 12 stacks, of which 2 have a problem and 3 others have an update, 1 image has critical vulnerabilities and 19 of the 20 actions of the last 30 days succeeded
- **THEN** the header SHALL show 2 needing attention, 3 with something new, 1 critical image and a 95% success rate

### Requirement: Stacks block

The first block SHALL summarise the stacks:

- a stacked bar with the stacks running without a problem (`running`, `deploying`), the stacks with a problem (a danger state — `unhealthy`, `dead`, `removing` —, `unknown`, `project_missing` or missing files) and the rest, each segment in its status tone and named with its count in a legend;
- the number of services, of services with a newer image and of stacks whose deployed commit differs from the latest one, the last two in the signal accent when greater than zero;
- the stacks that need attention, with the short reason (the missing project, the missing files, or else the state), and the stacks without a problem that have something new, with how many images and whether the commit changed. Each list SHALL be sorted by name, show at most five rows followed by "and N more", and show a one-line message when empty.

Every stack name SHALL link to `/stacks/<name>` and the block header SHALL link to `/stacks`.

#### Scenario: A stack with a problem and an update

- **WHEN** a stack is `unhealthy` and one of its images has an update
- **THEN** it SHALL be listed only among the stacks that need attention

### Requirement: Security block

The second block SHALL summarise `v0.security.list`:

- the CVEs of the scanned images per severity (critical, high, medium, low), summed image by image, as a stacked bar in the severity tones with a legend;
- how many images have a successful scan out of the total, how many have critical vulnerabilities (signal accent when greater than zero), how many urgent ones are fixable and how many scans failed;
- the images with the most critical, then high, vulnerabilities, by image name only (the full reference in the tooltip), in two columns of five rows (side by side from `sm`, the second continuing the first) so they match the height of the stacks block lists.

On wide screens the stacks and security blocks SHALL sit side by side and share their rows (header, bar, figures, lists), so both blocks have the same height and their rows line up. The block header SHALL link to `/security`. With scanning disabled it SHALL say so in place of the bar, and with no images it SHALL show a one-line message. A failed query SHALL show the backend message inside the block without hiding the other blocks.

#### Scenario: Scanning disabled

- **WHEN** the backend has no `TRIVY_SERVER_URL`
- **THEN** the security block SHALL explain that scanning is disabled while the other blocks keep working

### Requirement: Deployment activity block

The third block SHALL summarise the actions of `v0.history.activity` from local midnight 29 days ago to now:

- the number of actions, the success rate, the failed actions (signal accent when greater than zero), the share started with an API key (CI) and how long ago the latest one ran;
- a column chart with one column per local day, the succeeded actions in muted ink and the failed ones stacked above in the danger tone, a legend, the scale maximum, the first date and "today" under the axis, a tooltip with the day and its counts on hover, and a visually hidden table with every day for screen readers;
- the five stacks with the most actions as horizontal bars, each name linking to its page;
- the five latest failed actions, with the stack, the action and how long ago.

When the response is truncated it SHALL say that only the most recent actions are counted. With no actions it SHALL show a one-line message, and a failed query SHALL show the backend message inside the block. The block header SHALL link to `/history`.

#### Scenario: Days follow the user's time zone

- **WHEN** a deploy runs at 00:30 local time in UTC+2 (22:30 UTC of the previous day)
- **THEN** it SHALL be counted in the column of the local day

### Requirement: Running and stopped stacks

After the blocks, the overview SHALL list every running stack (`running`, `deploying`) and every stopped stack (`stopped`, `down`, `paused`, `created`) as compact lists with the state dot, the name linking to `/stacks/<name>` and the service count, `deploying` labelled as such, sorted by name. Each list SHALL be hidden when empty.

#### Scenario: Open a stack from the overview

- **WHEN** the user clicks `gitea` in the running list
- **THEN** the browser SHALL navigate to `/stacks/gitea`

### Requirement: Overview empty and error states

When `v0.stacks.list` fails, the overview SHALL show the shared error state with the backend message, a retry button and a link to `/credentials`. When there are no stacks, it SHALL show an empty state linking to `/credentials`. While loading, it SHALL show skeletons.

#### Scenario: Komodo not configured

- **WHEN** the stacks query fails with `503`
- **THEN** the overview SHALL show the error state with the message and a link to configure the connection
