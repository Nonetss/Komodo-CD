## Why

A scan result only changes when someone deploys a stack through Komodo CD or asks for a rescan. Two cases leave the Security page showing stale data. A CVE published today does not show up on an image that hasn't changed. And an image that Komodo updated on its own (Global Auto Update with poll for updates, a deploy from Komodo's UI, a procedure) keeps the result of its previous digest, because only `v0.deploy.trigger` queues a scan. Komodo CD now enrolls stacks in poll for updates from the bulk bar, so the second case has become the normal one.

## What Changes

- **Periodic rescan**: the backend rescans on its own every image used by a Komodo stack whose last scan attempt is older than a configurable interval (24 h by default). The interval is measured against the stored attempt time, so a restart does not reset it.
- **Deploys made inside Komodo**: every few minutes the backend reads Komodo's recent Updates. For every successful stack deploy (`DeployStack`, `DeployStackService`), whoever ran it, it queues the images of that stack unless they were already queued after that deploy started. This covers auto updates, deploys from Komodo's UI and procedures, and makes Komodo CD's own deploys a no-op because they are already queued.
- The same background sweep also queues images that were never scanned, so a new stack gets scanned without anyone opening the Security page. The trigger that runs when the images are listed stays as it is.
- A new optional env variable, `TRIVY_RESCAN_INTERVAL_HOURS` (non-negative number, default `24`). `0` turns off the periodic rescan only; tracking Komodo's deploys stays on whenever scanning is enabled. `compose.yml` passes it to the backend.
- Everything stays off when `TRIVY_SERVER_URL` is not set. A sweep that cannot reach Komodo (no connection or a Komodo error) is logged and retried on the next tick. It never fails anything else.
- No API or UI changes: the Security page already refreshes while images are queued or scanning.
- **No database migration**: the sweep uses the existing `image_scan` columns (`requested_at`, `attempted_at`).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `image-security`: the "Automatic scans" requirement gains the periodic rescan, the deploys made inside Komodo and the background sweep for never-scanned images; the scan queue requirement says the sweep stops on shutdown.
- `environment-configuration`: the server env gains the optional `TRIVY_RESCAN_INTERVAL_HOURS`.
- `docker-deployment`: the backend in `compose.yml` also gets `TRIVY_RESCAN_INTERVAL_HOURS` (default `24`).

## Impact

- Backend: a new scheduler in `packages/api/src/lib/` (a timer that runs the sweep). `packages/api/src/lib/komodo.ts` gains a call that lists recent stack deploy Updates. `packages/api/src/lib/image-scans.ts` gains the selection of stale images and of images deployed since their last request. `apps/backend/src/index.ts` starts the scheduler after bootstrap and stops it on shutdown, before the scan queue closes.
- Env: `packages/env/src/server.ts`, `.env.example`, `compose.yml`.
- Tests: `packages/api/tests/image-scans.test.ts` (or a new scheduler test) and `komodo.test.ts`, with Komodo and Trivy mocked.
- Docs: `README.md` and the site docs (configuration and how scans are triggered, in English and Spanish).
- Komodo: the backend's Komodo API key must be able to read the stacks' Updates, which it already can for the stacks it lists.
