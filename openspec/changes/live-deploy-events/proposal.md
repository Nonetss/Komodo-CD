## Why

The dashboard only learns about a deploy when the deploy was triggered from that same tab: `useDeployTrigger` invalidates the history and stacks queries on settle. A deploy launched by CI (`POST /api/v0/deploy`), by another user or from another tab does not show up on the History or Stacks page until someone hits refresh, and nothing tells the user that a stack is being redeployed right now. oRPC already ships what we need to push those changes: an in-memory pub/sub (`MemoryPublisher` from `@orpc/experimental-publisher`, the 1.x name of `@orpc/publisher`) and `eventIterator`, which streams typed events over SSE on both the RPC and the REST handlers.

## What Changes

- New in-memory deploy event bus in `packages/api/src/lib/`: every `v0.deploy.trigger` call publishes a `started` event before talking to Komodo and a `finished` event (success flag and message) once its history row is saved, whatever triggered it (session or API key). The bus also keeps the set of deploys currently in flight.
- New procedure `v0.deploy.watch` (`protectedProcedure`, `GET /api/v0/deploy/events`) that streams those events as SSE: first a `subscribed` event carrying the deploys in flight at that moment, then one event per change. It never replays past events.
- The Stacks page subscribes to the stream: a stack being deployed by someone else shows the same spinner and disabled buttons as a local action, and the stacks and history queries are refreshed when any deploy finishes.
- The History page subscribes to the stream and refreshes when any deploy finishes, so CI deploys appear without a manual refresh.
- The frontend reconnects with backoff when the stream drops and refreshes both queries on every (re)connection, since events missed while disconnected are not replayed.
- The backend ends every open event stream at the start of the graceful shutdown so the HTTP drain is not held by long-lived connections.
- The gateway relays event streams without buffering or compressing them.
- No database migration: events live in memory only; the history table is unchanged.

## Capabilities

### New Capabilities

- `deploy-events`: the in-memory deploy event bus, the `v0.deploy.watch` stream (event shapes, `subscribed` snapshot, no replay, single-instance scope) and the frontend subscription hook with reconnection.

### Modified Capabilities

- `stacks-overview`: "Run actions from the list" also reflects deploys started elsewhere (spinner, disabled buttons, bulk bar), and the list refreshes when any deploy finishes.
- `deploy-history`: the History page refreshes when any deploy finishes, not only after a deploy from the same tab.
- `api-access-control`: `v0.deploy.watch` joins the `protectedProcedure` list.
- `api-documentation`: the REST API lists `GET /api/v0/deploy/events`.
- `http-server`: graceful shutdown ends open event streams before draining HTTP.
- `http-gateway`: event-stream responses are proxied unbuffered and uncompressed.

## Impact

- `packages/api`: new `src/lib/deploy-events.ts`, `v0/deploy` (`handler.ts`, `output.ts`, `router.ts`), new dependency `@orpc/experimental-publisher` (added to the root catalog at the oRPC version in use), tests in `packages/api/tests/`.
- `apps/backend`: shutdown step that closes the event streams (`src/index.ts`).
- `apps/gateway/routes.caddy`: no compression for `text/event-stream`.
- `apps/frontend`: new hook in `src/entities/deploy-action/hooks/`, Stacks page (`features/stacks`) and History page (`features/history`) wiring; no new UI copy expected.
- Scope limit: the bus is per process. Komodo CD runs one backend instance; running several would need a publisher with an external transport (e.g. Redis) — out of scope.
- Docs: the API page of the site (`apps/site/src/content/docs/en/api.md` and `es/api.md`) documents the new endpoint.
