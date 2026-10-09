## 1. Deploy event bus

- [x] 1.1 Add `@orpc/experimental-publisher` to the root `package.json` catalog at the oRPC version in use and as a `catalog:` dependency of `packages/api`; run `bun install`
- [x] 1.2 Create `packages/api/src/lib/deploy-events.ts`: `DeployRun` / `DeployEvent` types, `MemoryPublisher<{ "deploy-changed": DeployEvent }>`, in-flight `Map`, shutdown `AbortController`, all kept on `globalThis` so `bun --hot` reuses them
- [x] 1.3 Implement `publishDeployStarted`, `publishDeployFinished`, `runningDeploys`, `subscribeDeployEvents(signal)` (tied to the shutdown signal with `AbortSignal.any`) and `closeDeployEvents`
- [x] 1.4 Write `packages/api/tests/deploy-events.test.ts`: a subscriber receives events published after it subscribed and none from before; `started` adds the run to `runningDeploys()` and `finished` removes it; `closeDeployEvents` ends open iterators; then run `bun run test`

## 2. Publish from `v0.deploy.trigger`

- [x] 2.1 In `deployHandler.trigger`, build the run (`crypto.randomUUID()`, stack, action, `startedAt`, `via` / `actorName` from `parseActor`) and publish `started` before the first Komodo call
- [x] 2.2 Publish `finished` after `saveHistory` in the success path and in the failure path (before `notifyDeployFailure`), with a `finally` that removes the run from the in-flight map; publishing must never change the procedure's result
- [x] 2.3 Extend `packages/api/tests/deploy.test.ts`: an API key deploy publishes `started` and `finished` with `via: "apiKey"` and the key name; a Komodo failure publishes `finished` with `success: false` and the error message; the history row exists when `finished` is received; the `trigger` response is unchanged; then run `bun run test`

## 3. `v0.deploy.watch` procedure

- [x] 3.1 Add the event schemas to `packages/api/src/v0/deploy/output.ts` (`deployOutput.event`: discriminated union `subscribed` / `started` / `finished`, sharing a `deployRun` schema)
- [x] 3.2 Add `deployHandler.watch({ signal })` as an async generator: subscribe first, yield `subscribed` with `runningDeploys()`, then yield each bus event
- [x] 3.3 Wire `deployRouter.watch` in `router.ts`: `protectedProcedure` → `.route({ method: "GET", path: "/v0/deploy/events", summary, description, tags: ["Deploy"] })` → `.output(eventIterator(deployOutput.event))` → `.handler()`
- [x] 3.4 Write the tests in `packages/api/tests/deploy-events.test.ts` (fixtures from `tests/fixtures/context.ts`): the first event is `subscribed` with the in-flight runs; later `started` / `finished` are delivered; an API key context is authorized; an anonymous context fails with `UNAUTHORIZED`; aborting the signal ends the iterator. Extend `access.test.ts` if it enumerates procedure tiers; then run `bun run test`

## 4. Backend shutdown and gateway

- [x] 4.1 In `apps/backend/src/index.ts`, add `step("events", closeDeployEvents)` as the first shutdown step, before `stopHttpServer`, with a Spanish comment on why
- [x] 4.2 Check that neither `RPCHandler` (`apps/backend/src/routers/rpc.ts`) nor `OpenAPIHandler` (`routers/openapi.ts`) disables oRPC's event iterator keep-alive (it must stay below Bun's 10 s `idleTimeout`)
- [x] 4.3 In `apps/gateway/routes.caddy`, give `encode zstd gzip` an explicit `match` of compressible content types that leaves out `text/event-stream`; validate the file with `caddy fmt`/`caddy adapt` if Caddy is available locally, otherwise ask the user to check it

## 5. Frontend live subscription

- [x] 5.1 Create `apps/frontend/src/entities/deploy-action/hooks/use-deploy-events.ts`: in a `useEffect`, subscribe with `client.v0.deploy.watch(undefined, { signal })`, keep a `Record<stack, DeployRun>` of runs in flight (replace on `subscribed`, add on `started`, remove on `finished`), invalidate `orpc.v0.history.key()` and `orpc.v0.stacks.key()` on `finished` and on every resubscription after the first, reconnect with backoff capped at 30 s, abort on unmount; export it from `entities/deploy-action/index.ts`
- [x] 5.2 Stacks page (`features/stacks/components/stacks-page.tsx`): call `useDeployEvents()` and merge its runs into the per-row pending action and `bulkDisabled` (`pending[name] ?? running[name]?.action ?? null`); toasts stay only for actions started from the page
- [x] 5.3 History page (`features/history/components/history-page.tsx`): call `useDeployEvents()` so the history refreshes when any deploy finishes
- [x] 5.4 Confirm no new UI copy was needed; if any was added, add it to both `apps/frontend/src/locales/es.ts` and `en.ts`

## 6. Docs

- [x] 6.1 Document `GET /api/v0/deploy/events` (SSE, `x-api-key`, event shapes, no replay, `curl -N` example) in `apps/site/src/content/docs/en/api.md` and `es/api.md` together; mention it in `README.md` if it lists the REST endpoints

## 7. Validation

- [x] 7.1 Run `bun run test`, `bun run check-types` and `bunx biome check .`
- [x] 7.2 Run `openspec validate --all --strict`
- [x] 7.3 Ask the user to confirm at runtime (screenshot or pasted output): a `curl -N` to `/api/v0/deploy/events` through the gateway streams events uncompressed, and a CI deploy shows its spinner on the Stacks page and appears in History without refresh
