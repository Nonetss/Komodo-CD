## 1. Environment and compose

- [x] 1.1 Add `TRIVY_RESCAN_INTERVAL_HOURS: z.coerce.number().min(0).default(24)` to `packages/env/src/server.ts`, with a Spanish comment (`0` turns off the periodic rescan only)
- [x] 1.2 Document the variable, commented out, in the Trivy block of `.env.example` (Spanish)
- [x] 1.3 Pass `TRIVY_RESCAN_INTERVAL_HOURS: "${TRIVY_RESCAN_INTERVAL_HOURS:-24}"` to the backend in `compose.yml` (`compose.dev.yml` already loads `.env`)

## 2. Komodo: recent stack deploys

- [x] 2.1 Add `komodoService.listRecentStackDeploys()` to `packages/api/src/lib/komodo.ts`: `ListUpdates` page 0 with the `target.type` / `operation` query of design decision 2, filtered again on the client (`Stack`, `DeployStack` | `DeployStackService`, `Complete`, `success`), returning `{ stackId, startedAt: Date }[]`; it logs and rethrows like the other calls
- [x] 2.2 Test it in `packages/api/tests/komodo.test.ts` (Komodo client mocked): the client-side filter drops failed, in-progress, non-stack and other-operation Updates, and `startedAt` comes from `start_ts`; run `bun run test`

## 3. Queue: deployed, stale and closed

- [x] 3.1 In `packages/api/src/lib/image-scans.ts`, add a `closed` flag set by `close()`, so that `enqueue` returns `[]` once it is set
- [x] 3.2 Add `enqueueDeployed(deployedAt: Map<string, Date>)`: it queues the images with no row or whose `requestedAt` is earlier than their deploy time truncated to seconds
- [x] 3.3 Add `enqueueStale(images: string[], olderThan: Date)`: it queues the images whose row is `done` or `failed` with `coalesce(attemptedAt, requestedAt) < olderThan`
- [x] 3.4 Extend `packages/api/tests/image-scans.test.ts` (Trivy mocked): `enqueueDeployed` queues images requested before the deploy, skips the ones requested after it or in the same second, and queues the ones with no row; `enqueueStale` queues old `done` and `failed` images and skips recent, `queued` and `scanning` ones; a closed queue queues nothing; run `bun run test`

## 4. Scan scheduler

- [x] 4.1 Create `packages/api/src/lib/scan-scheduler.ts` with `ScanScheduler` (`start()`, `stop()`, `sweep()`) and a singleton on `globalThis`, as in design decision 1: no start when scanning is disabled or when already started, a first sweep after about 30 s and then every 5 min, `unref`'d timers, ticks skipped while a sweep is running, Spanish comments
- [x] 4.2 Implement `sweep()`: read the stacks once (a missing connection logged at `debug`, other errors at `warn`, then return), `enqueueMissing`, the deploy trigger in its own `try` (latest deploy per stack → the latest per image across its stacks, unknown stack ids dropped → `enqueueDeployed`), and `enqueueStale` when `TRIVY_RESCAN_INTERVAL_HOURS > 0`; one `info` log line when something was queued
- [x] 4.3 Write `packages/api/tests/scan-scheduler.test.ts` (Komodo and Trivy mocked, stacks from `tests/fixtures/stacks.ts`; add Update fixtures there or in a new fixture): a never-scanned image is queued; an auto update queues its stack's images; a deploy already covered queues nothing; an image used by two stacks takes the latest deploy; a deleted stack's Update is ignored; a stale image is queued and a recent one is not; an interval of `0` skips the stale trigger only; a `ListUpdates` failure still runs the stale trigger; no Komodo connection queues nothing and does not throw; `start()` does nothing when scanning is disabled; run `bun run test`

## 5. Backend lifecycle

- [x] 5.1 In `apps/backend/src/index.ts`, call `scanScheduler.start()` after `komodoService.initialize()` inside the bootstrap guard, and add `step("scheduler", () => scanScheduler.stop())` before the `scans` step, with Spanish comments explaining the order

## 6. Docs

- [x] 6.1 `README.md` (English): the `TRIVY_RESCAN_INTERVAL_HOURS` row in the env table, the variable in the compose excerpt, and the new triggers (background sweep for new images, deploys made inside Komodo, periodic rescan) where it says when images are scanned (feature list and the CI/API paragraph)
- [x] 6.2 Site docs, `en` and `es` together: `configuration.md` (the variable), `architecture.md` (the list of scan triggers) and `deploy.md` (the compose excerpt); check `ci.md` and `first-run.md` for any wording that says scans only happen on deploy or on demand

## 7. Validation

- [x] 7.1 Run `bun run test`, `bun run check-types` and `bunx biome check .`, and fix what they report
- [x] 7.2 Run `openspec validate --all --strict`
