## Context

`v0.deploy.trigger` (`packages/api/src/v0/deploy/handler.ts`) calls Komodo, writes an `action_history` row and, on failure, notifies ntfy. The dashboard learns about it only through `useDeployTrigger` (`apps/frontend/src/entities/deploy-action/hooks/use-deploy-trigger.ts`), which invalidates the history and stacks queries when the mutation settles in that tab. Deploys from CI, other users or other tabs are invisible until a manual refresh, and the Stacks page's per-stack spinner (`pending` state in `features/stacks/components/stacks-page.tsx`) only knows its own calls.

oRPC 1.15 (the catalog version) provides `eventIterator` in `@orpc/server` and an in-memory `MemoryPublisher` in `@orpc/experimental-publisher` (renamed `@orpc/publisher` in oRPC 2; the `@orpc/publisher@1.x` line on npm is stale at 1.14). Both `RPCHandler` (`/rpc`) and `OpenAPIHandler` (`/api`) serve an event iterator as SSE, with keep-alive comments every 5 s by default. Komodo CD runs one backend process, Bun with `idleTimeout` at its 10 s default, behind Caddy (`encode zstd gzip` for every response) and, in dev, the Vite proxy.

## Goals / Non-Goals

**Goals:**

- One event stream of deploy activity (`started` / `finished`) fed by every `v0.deploy.trigger` call, readable by the dashboard and by CI.
- Stacks and History pages that update by themselves and show deploys in flight started elsewhere.
- No regression in shutdown time, gateway behaviour or the `v0.deploy.trigger` contract.

**Non-Goals:**

- Multi-instance fan-out (Redis or another external transport): one backend instance is the supported topology.
- Replaying missed events or persisting them: the history table is the durable record; the client re-reads it on reconnect.
- Watching Komodo itself (stack state changes made in Komodo's UI, container crashes): Komodo CD has no feed from Komodo, and polling it is a separate change.
- Live sync of configuration (Komodo connection, ntfy, API keys) across tabs.
- The Deploy page and new UI copy: the existing spinner/disabled states are reused.

## Decisions

### 1. Event bus in `packages/api/src/lib/deploy-events.ts`

A module next to `komodo.ts` and `ntfy.ts` exposing:

- `publishDeployStarted(run)` / `publishDeployFinished(run, outcome)` — publish on a `MemoryPublisher<{ "deploy-changed": DeployEvent }>` and keep a `Map<runId, DeployRun>` of runs in flight.
- `subscribeDeployEvents(signal)` — `publisher.subscribe("deploy-changed", { signal })`, the async iterator the procedure consumes.
- `runningDeploys()` — snapshot of the in-flight map for the `subscribed` event.
- `closeDeployEvents()` — aborts a module-level `AbortController` that every subscription is tied to (`AbortSignal.any([signal, shutdownSignal])`), so the shutdown can end all streams at once.

The publisher, map and controller live on `globalThis` (`globalThis.__deployEvents ??= …`), the same trick `apps/backend/src/index.ts` uses, so a `bun --hot` reload does not split publishers from live subscribers in dev.

*Alternatives*: an `EventEmitter` plus a hand-written async iterator (more code, no typed channels, no abort wiring); putting the bus inside `v0/deploy/` (it is a service shared by the handler, the router and the backend shutdown, which is what `lib/` is for).

### 2. Publishing from `deployHandler.trigger`

The handler builds the run (`id: crypto.randomUUID()`, `stack`, `action`, `startedAt`, and `via` / `actorName` from `parseActor(user)` so the actor reads exactly as in the history) and publishes `started` before the first Komodo call. `finished` is published after `saveHistory` in both the success and failure paths (before the ntfy notification on failure, which can take up to 5 s), so a subscriber that refetches on `finished` always sees the row. A `try/finally` guarantees the run leaves the in-flight map even if something unexpected throws. Publishing is synchronous and in-memory; it is wrapped so it can never change the procedure's result.

### 3. `v0.deploy.watch` procedure — `protectedProcedure`

`GET /v0/deploy/events`, tag `Deploy`, no input, `.output(eventIterator(deployOutput.event))` where `deployOutput.event` is a zod discriminated union on `type`: `subscribed { running: DeployRun[] }`, `started { run }`, `finished { run, success, message, finishedAt }`. The handler is an async generator: yield `subscribed` with `runningDeploys()`, then `for await` over `subscribeDeployEvents(signal)` yielding each event. It subscribes *before* reading the snapshot so no event can fall between the two; a `started` that is both in the snapshot and delivered is harmless (the client keys runs by id).

**Tier: `protectedProcedure`.** The stream carries what `v0.history.list` already exposes (stack, action, actor, outcome) and no configuration or credentials, and CI benefits from it (a pipeline can follow a deploy it or another job started). By the access rule — what CI needs is `protectedProcedure`, configuration and credentials are `sessionProcedure` — it is protected. `v0.deploy.trigger` keeps its tier.

The path `/v0/deploy/events` does not collide with `/v0/deploy/credentials/*`.

### 4. Frontend hook `useDeployEvents` in `entities/deploy-action/hooks/`

Both Stacks and History need it and a feature cannot import another feature, so it belongs to the `deploy-action` entity, exported from its `index.ts`. In a `useEffect` (never during SSR) it loops: `client.v0.deploy.watch(undefined, { signal })`, `for await` over the events, updating a `Record<stack, DeployRun>` state and invalidating `orpc.v0.history.key()` and `orpc.v0.stacks.key()` on `finished`. When the iterator ends or throws (and the effect is still mounted) it waits `min(1 s · 2^attempt, 30 s)` and resubscribes; a `subscribed` event resets the attempt counter and, if it is not the first one, invalidates both queries to cover missed events. Cleanup aborts the controller.

Each Astro page mounts a single island, so one tab holds at most one stream.

*Alternative*: oRPC's TanStack `experimental_liveOptions` / `streamedOptions`. They turn the stream into query data, but what we need is side effects (invalidations) plus an in-flight map and our own reconnection policy; a plain hook over the typed client is simpler and avoids an experimental API.

### 5. Page wiring

- **Stacks page**: `const live = useDeployEvents()`; the row's pending action becomes `pending[name] ?? live.running[name]?.action ?? null`, and `bulkDisabled` uses the same merged value. Toasts stay tied to calls made from the page, so a CI deploy only refreshes the lists.
- **History page**: calls `useDeployEvents()` only for its invalidations.
- `useDeployTrigger` keeps its `onSettled` invalidations as the fallback when the stream is down; TanStack cancels and dedupes the overlapping refetch.

### 6. Shutdown and transport

- `apps/backend/src/index.ts`: a first shutdown step `step("events", closeDeployEvents)` before `stopHttpServer`, so open SSE requests complete and `server.stop()` drains without hitting the 5 s timeout.
- Bun's 10 s `idleTimeout` is covered by oRPC's default 5 s keep-alive on both handlers; the handlers keep the defaults (no option needed, but none may disable it).
- `apps/gateway/routes.caddy`: give `encode` an explicit `match` that lists the compressible types (HTML, CSS, JS, JSON, SVG, plain text…) without `text/event-stream`, so SSE is never wrapped by the compressor. `reverse_proxy` already flushes `text/event-stream` immediately.
- The Vite dev proxy streams responses as they come; no change.

## Risks / Trade-offs

- [Several backend instances would each have their own bus and dashboards would miss deploys handled by another instance] → Documented single-instance scope; the bus is isolated behind `lib/deploy-events.ts`, so swapping in a publisher with an external transport (e.g. Redis) touches one module.
- [Events published while a client is reconnecting are lost] → The client invalidates history and stacks on every resubscription; the in-flight map is rebuilt from the `subscribed` snapshot.
- [A run stuck in the in-flight map if the process dies mid-deploy] → The map is in memory and dies with the process; `finally` covers thrown errors.
- [Browsers limit HTTP/1.1 to 6 connections per origin; many tabs each holding a stream could starve other requests] → One stream per tab; the gateway speaks h2c, and the TLS proxy in front should serve HTTP/2. Documented, not mitigated further.
- [`@orpc/experimental-publisher` is experimental and renamed in oRPC 2] → Pinned through the catalog at the oRPC version in use; the rename is a one-line import change in one module when upgrading.
- [Caddy's encode default list includes `text/*`, which may buffer SSE] → Explicit `match` list excluding `text/event-stream` (decision 6).

## Migration Plan

No database migration. Deploy order is irrelevant: an old frontend ignores the new procedure, and a new frontend against an old backend just keeps retrying the stream with backoff while the rest works. Rollback is reverting the change.

## Open Questions

None.
