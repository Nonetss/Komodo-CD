## MODIFIED Requirements

### Requirement: Scan queue

Scans SHALL run in the backend through an in-memory queue with at most two scans at a time. Queuing an image that is already queued or scanning SHALL do nothing. Queuing SHALL mark the image `queued` (creating its row if needed) and set its request time, without discarding its previous result. On shutdown, the background sweep SHALL be stopped first and then running scans SHALL be stopped, both before the HTTP server drains; once the queue is closed, queuing SHALL do nothing. Images left `queued` or `scanning` SHALL be queued again by the missing-information trigger.

#### Scenario: Duplicate request

- **WHEN** the same image is requested twice while its first scan is running
- **THEN** only one scan of that image SHALL run

#### Scenario: Sweep during shutdown

- **WHEN** a background sweep tries to queue images after the queue was closed on shutdown
- **THEN** no image SHALL be queued and no scan SHALL start

### Requirement: Automatic scans

When scanning is enabled, the system SHALL queue scans without user action:

- **missing information**: every time `v0.security.list` runs, and on every background sweep, every image used by a Komodo stack that has no stored row, or whose row is `queued` or `scanning` without being in the in-memory queue, SHALL be queued (for `v0.security.list`, before the response is built);
- **after a deploy**: after every successful `v0.deploy.trigger` (any action), the non-empty images of that stack SHALL be queued, without delaying, changing or failing the deploy response. A failed deploy SHALL queue nothing;
- **deploys made inside Komodo**: on every background sweep, the system SHALL read Komodo's most recent page of Updates and, for every complete and successful `DeployStack` or `DeployStackService` Update of a stack, whoever triggered it, SHALL queue each non-empty image of that stack that has no stored row or whose request time is earlier than the Update's start time (both compared at second precision). Updates of stacks that no longer exist SHALL be ignored;
- **periodic rescan**: when `TRIVY_RESCAN_INTERVAL_HOURS` is greater than `0`, on every background sweep, every image used by a Komodo stack whose row is `done` or `failed` and whose last attempt time (its request time when it has none) is older than that many hours SHALL be queued.

The background sweep SHALL run once shortly after the backend starts and then every 5 minutes, only when scanning is enabled. A sweep SHALL read the Komodo stacks once and share them among its triggers; a sweep SHALL not start while the previous one is still running. A sweep that fails (no Komodo connection, a Komodo error, a database error) SHALL be logged and SHALL not stop the following sweeps; a failure reading the Updates SHALL not prevent the other triggers of the same sweep.

#### Scenario: New image appears

- **WHEN** a stack starts using `redis:7.4` and the Security page lists the images
- **THEN** `redis:7.4` SHALL be returned with status `queued` (or `scanning` if its scan already started) and a scan SHALL start

#### Scenario: New image scanned without opening the page

- **WHEN** a stack starts using `redis:7.4` and nobody opens the Security page
- **THEN** the next background sweep SHALL queue `redis:7.4`

#### Scenario: Deploy queues a rescan

- **WHEN** CI runs `pull-redeploy` on stack `web` successfully
- **THEN** the deploy SHALL answer as before and the images of `web` SHALL be queued for scanning

#### Scenario: Komodo lookup fails after a deploy

- **WHEN** reading the stack's images from Komodo fails after a successful deploy
- **THEN** the error SHALL be logged and the deploy response SHALL be unaffected

#### Scenario: Auto update inside Komodo

- **WHEN** Komodo's Global Auto Update redeploys stack `web` (a successful `DeployStackService` Update) and `ghcr.io/acme/app:latest`, an image of `web`, was last requested before that Update started
- **THEN** the next background sweep SHALL queue `ghcr.io/acme/app:latest`

#### Scenario: Deploy already covered

- **WHEN** a sweep reads the successful `DeployStack` Update of a deploy made through `v0.deploy.trigger`, whose images were queued after it finished
- **THEN** the sweep SHALL queue nothing for that Update

#### Scenario: Failed deploy inside Komodo

- **WHEN** the most recent `DeployStack` Update of stack `web` failed
- **THEN** that Update SHALL queue nothing

#### Scenario: Stale result

- **WHEN** `TRIVY_RESCAN_INTERVAL_HOURS` is `24` and `nginx:1.27`, still used by a stack, was last attempted 25 hours ago
- **THEN** the next background sweep SHALL queue `nginx:1.27`, keeping its previous result until the new scan finishes

#### Scenario: Periodic rescan turned off

- **WHEN** `TRIVY_RESCAN_INTERVAL_HOURS` is `0` and an image was last attempted a week ago
- **THEN** no sweep SHALL queue it for its age, and deploys made inside Komodo SHALL still queue their stacks' images

#### Scenario: Komodo not configured

- **WHEN** a background sweep runs while no Komodo connection is configured
- **THEN** the sweep SHALL queue nothing, log the reason and run again on the next tick
