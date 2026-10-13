## Context

`ImageScanQueue` (`packages/api/src/lib/image-scans.ts`) is the only way to start a scan. Today three paths call it, all tied to a request: `v0.security.list` (`enqueueMissing`), `v0.deploy.trigger` (`enqueueStack`) and `v0.security.scan`. The backend has no background timer. The `image_scan` row of each image already stores `requestedAt` (set on every enqueue), `attemptedAt` (set when a scan ends, successful or not) and `scannedAt`. All three columns are `integer(..., { mode: "timestamp" })`, so they have **second** precision.

Trivy reads the images from their registry (`--image-src remote`). A scan therefore reflects what the tag points to in the registry when it runs, not the container that is running. A deploy matters here because it signals that the tag has probably moved and that Komodo is now running it.

Komodo records every operation as an `Update` (`ListUpdates`, sorted newest first, one page of 100, with an optional Mongo `query`). Each item has `operation`, `target` (`{ type: "Stack", id }`), `start_ts` (ms), `success`, `status` and `operator`. The Global Auto Update, deploys from Komodo's UI and procedures all leave `DeployStack` or `DeployStackService` Updates. So do deploys made through Komodo CD, which run `PullStack` + `DeployStack`.

## Goals / Non-Goals

**Goals:**

- Images get rescanned on their own: new CVEs on an image that hasn't changed show up within the configured interval (24 h by default).
- A deploy made inside Komodo (auto update, UI, procedure) leads to a rescan within one sweep (about 5 minutes).
- No new state: everything is derived from Komodo and from the `image_scan` columns. Restarts lose nothing and need no migration.

**Non-Goals:**

- Comparing registry digests without scanning, or scanning the image a container is actually running.
- Configuring the interval from the UI, or showing "next rescan" information on the Security page.
- Subscribing to Komodo's websocket of Updates. Polling is enough at this latency.
- Spreading the 24 h rescans over time. They go through the same 2-at-a-time queue.

## Decisions

### 1. One background sweep, every 5 minutes

A new `packages/api/src/lib/scan-scheduler.ts` exports a `ScanScheduler` with `start()`, `stop()` and `sweep()`. Its singleton lives on `globalThis`, like the queue, so that `bun --hot` neither duplicates timers nor loses them. `start()` does nothing when scanning is disabled (`trivyService.isEnabled()`) or when it is already started. It runs the first sweep after a short delay (about 30 s, so it doesn't compete with bootstrap) and then every 5 minutes (`SWEEP_INTERVAL_MS`, a constant). The timers are `unref`'d. A `running` flag skips a tick while the previous sweep is still running.

Each sweep does this:

1. `komodoService.listAllStacks()` once, then `collectImages` and an `id → stack name` map. If this fails (`SERVICE_UNAVAILABLE` when no connection is configured, or a Komodo error), the sweep logs it and ends: none of the triggers can work without the stacks. A missing connection is logged at `debug`, because it is an expected state; other errors at `warn`.
2. `imageScans.enqueueMissing(images)`: never-scanned or orphaned images, the same as listing does.
3. The deploys made inside Komodo (decision 2). Wrapped in its own `try`, so that a failing `ListUpdates` does not prevent step 4.
4. The stale images (decision 3).

It logs one `info` line when it queued something (how many images, per trigger), and nothing otherwise.

*Alternatives:* a separate timer per trigger (more lifecycle code, and the stacks would be read twice); a cron library (a dependency for one `setInterval`); making the interval configurable (5 minutes is short for a deploy signal and does not overload Komodo, so it is not worth another variable).

### 2. Deploys inside Komodo: stateless, using `requestedAt`

`komodoService.listRecentStackDeploys()` calls `ListUpdates` (page 0) with `query: { "target.type": "Stack", operation: { $in: ["DeployStack", "DeployStackService"] } }`. It filters again on the client (`target.type === "Stack"`, those operations, `status === "Complete"`, `success`), in case some Komodo version ignores part of the query, and returns `{ stackId, startedAt: Date }[]`.

The scheduler groups the result by stack and keeps the latest `startedAt` of each one. It drops ids that are not in the stack map (deleted stacks), turns each stack into its images, and per image keeps the latest `startedAt` of the stacks that use it. A new queue method, `enqueueDeployed(deployedAt: Map<image, Date>)`, reads the rows of those images and queues the ones with no row or with `requestedAt < deployedAt` truncated to seconds, the precision of the column.

No cursor is kept: the decision only compares each image's last request with its last deploy, so it is idempotent. Once an image is queued, its `requestedAt` passes the deploy and later sweeps skip it. It also catches up after downtime, as long as the deploy is still on the first page. And Komodo CD's own deploys need no special case: `enqueueStack` runs after the deploy has finished, so `requestedAt` is already later than the Update's `start_ts` when the sweep reads it.

*Alternatives:* an in-memory "last seen" cursor (lost on restart, so deploys during downtime would be missed, and it would still need a skip rule for Komodo CD's own deploys); filtering out Komodo CD's deploys by `operator` (the API key's user is not known from here, and the `requestedAt` rule already covers them); including `PullStack` (a pull does not change the running containers, and Komodo CD's pulls are followed by a `DeployStack` anyway); polling `update_available` on the stack's services (it says an update exists, not that one was deployed).

### 3. Periodic rescan from `attemptedAt`

New env `TRIVY_RESCAN_INTERVAL_HOURS: z.coerce.number().min(0).default(24)`. When it is `> 0`, a new queue method `enqueueStale(images, olderThan: Date)` selects, among the images in use, the rows with `status` `done` or `failed` and `coalesce(attemptedAt, requestedAt) < olderThan` that are not tracked, and queues them. Failed images are retried as well. A registry that denied access yesterday may allow it today, and once a day is a cheap retry. Rows that are `queued` or `scanning` stay with `enqueueMissing`.

Using `attemptedAt` rather than `scannedAt` keeps an image that always fails from being requeued on every sweep: its `attemptedAt` moves forward even when `scannedAt` does not. Only images still used by a stack are considered, so a removed image keeps its row and its last result but is never rescanned.

*Alternatives:* `scannedAt` (an image that keeps failing would be retried every 5 minutes); rescanning everything at a fixed time of day (a burst at one moment, and a restart at that time skips it; age-based selection catches up on its own).

### 4. Shutdown order and a closed queue

`apps/backend/src/index.ts` calls `scanScheduler.start()` after `komodoService.initialize()`, inside the bootstrap guard. On shutdown it adds a `step("scheduler", () => scanScheduler.stop())` before `step("scans", ...)`. `stop()` clears the timers and does not wait for a sweep in progress. To keep that sweep from queuing scans after shutdown has started, `ImageScanQueue.close()` sets a `closed` flag and `enqueue` returns `[]` while it is set. The flag only exists for shutdown: nothing reopens the queue.

### 5. No API, UI or schema changes

No procedure is added or changed, so no access tier is involved: the sweep is internal and calls the queue directly. The Security page already polls while images are `queued` or `scanning`, so automatic rescans show up there. A rescan keeps the previous result until it finishes, as it already does. The existing columns are enough, so there is no migration.

### 6. Configuration and docs

`compose.yml` passes `TRIVY_RESCAN_INTERVAL_HOURS: "${TRIVY_RESCAN_INTERVAL_HOURS:-24}"` to the backend. The dev stack already loads the root `.env` (`env_file`), so `compose.dev.yml` needs no change. `.env.example` documents the variable in its Trivy block, in Spanish like the rest of the file. `README.md` and the site docs (`configuration.md` in `en`/`es`, plus the paragraphs that list when images are scanned) gain the variable and the two new triggers.

## Risks / Trade-offs

- [Komodo v2 could change `ListUpdates` (the query, the page or the field names)] → The client-side filter tolerates an ignored query. A failure is logged at `warn` for each sweep and only disables the deploy trigger: the periodic rescan still picks the change up within the interval.
- [Every image was scanned at about the same time, so every 24 h they all become stale together and fill the queue] → The queue runs 2 at a time and a manual or deploy scan just waits its turn. Acceptable for a self-hosted dashboard; spreading the scans is a non-goal.
- [`requestedAt` has second precision, so a deploy that started in the same second as a request is treated as covered] → Practically impossible for a real deploy, which takes seconds. The worst case is a missed rescan that the periodic rescan fixes later.
- [A scan requested while a Komodo deploy is still running reads the tag before the new image is pushed or pulled] → The comparison uses the Update's start time and only `Complete` Updates. A scan requested mid-deploy counts as covering it, but the registry tag has normally moved before the deploy starts. The periodic rescan bounds the error.
- [More than 100 stack deploys between two sweeps (5 minutes), or during a long downtime] → The oldest ones are not seen. Their stacks are still covered by the periodic rescan.
- [The API key's user cannot read some stacks' Updates] → Those stacks are the ones it cannot list either, so nothing changes compared with today.

## Migration Plan

No data migration. Deploy the new backend image; with `TRIVY_SERVER_URL` set, the first sweep runs about 30 s after boot. Every image whose last attempt is older than 24 h gets queued once, which is expected on the first upgrade. To roll back, set `TRIVY_RESCAN_INTERVAL_HOURS=0` (this keeps deploy tracking) or roll back the image.

## Open Questions

_None._
