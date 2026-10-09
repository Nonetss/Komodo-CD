# Deploy Events

## Purpose

Streams deploy activity live: every `v0.deploy.trigger` call is announced on an in-memory event bus when it starts and when it finishes, `v0.deploy.watch` exposes those events as Server-Sent Events to the dashboard and to CI, and the dashboard uses them to refresh its pages and show deploys in flight started elsewhere. The bus lives in one backend process.

## Requirements

### Requirement: Deploy event bus

`packages/api/src/lib/deploy-events.ts` SHALL hold an in-memory publisher (oRPC `MemoryPublisher`) of deploy changes and the set of deploys currently in flight. Every `v0.deploy.trigger` call, whether authenticated with a session or an API key, SHALL publish a `started` event before its first Komodo call and a `finished` event after its history row has been written, both when the action succeeds and when it fails. A deploy run SHALL be described as `{ id, stack, action, via, actorName, startedAt }`, where `id` is unique per call, `via` and `actorName` identify the actor exactly as the history does, and `startedAt` is an ISO string; a `finished` event SHALL add `success`, `message` and `finishedAt`. A run SHALL be in the in-flight set from its `started` event until its `finished` event. Publishing SHALL never make a deploy fail, and the response of `v0.deploy.trigger` SHALL be unchanged. The bus SHALL be scoped to one backend process.

#### Scenario: CI deploy publishes both events

- **WHEN** a request with a valid `x-api-key` for a key named `github` triggers `{ stack: "web", action: "redeploy" }` and Komodo succeeds
- **THEN** the bus SHALL publish a `started` event for `web` with `via: "apiKey"` and `actorName: "github"`, then a `finished` event for the same run `id` with `success: true`

#### Scenario: Failed deploy still finishes

- **WHEN** Komodo rejects a pull on `web`
- **THEN** the bus SHALL publish a `finished` event with `success: false` and the Komodo error message, and `web` SHALL leave the in-flight set

#### Scenario: History is written before the finished event

- **WHEN** a subscriber receives the `finished` event of a deploy
- **THEN** `v0.history.list` SHALL already return that deploy's row

### Requirement: Watch deploy events

The system SHALL expose `v0.deploy.watch` as a `protectedProcedure` (`GET /api/v0/deploy/events`, tag `Deploy`) whose output is an oRPC event iterator, sent as Server-Sent Events over both `/rpc` and `/api`. The stream SHALL first emit `{ type: "subscribed", running }` with the runs in flight at subscription time, then one `{ type: "started", run }` or `{ type: "finished", run, success, message, finishedAt }` event per change published after the subscription. Events published before the subscription SHALL NOT be replayed. The stream SHALL stay open until the client aborts it or the backend shuts down, and SHALL send keep-alive comments often enough that idle connections are not closed by the server's idle timeout.

#### Scenario: Subscribe during a deploy

- **WHEN** a client subscribes while a redeploy of `web` is in flight
- **THEN** the first event SHALL be `subscribed` with a `running` list containing that run

#### Scenario: No replay

- **WHEN** a deploy finishes and a client subscribes afterwards
- **THEN** the client SHALL receive `subscribed` with an empty `running` list and no event for that deploy

#### Scenario: Anonymous subscriber

- **WHEN** an unauthenticated request calls `GET /api/v0/deploy/events`
- **THEN** the system SHALL answer `401` without opening a stream

#### Scenario: Client disconnects

- **WHEN** a subscriber aborts its request
- **THEN** its subscription SHALL be removed from the publisher

### Requirement: Live deploy subscription in the dashboard

The frontend SHALL provide one hook in `apps/frontend/src/entities/deploy-action/` that, while mounted in the browser, subscribes to `v0.deploy.watch` through the typed oRPC client and exposes the in-flight deploys by stack name. On `subscribed` it SHALL replace that map with the snapshot, on `started` add the run and on `finished` remove it and invalidate the history and stacks queries. When the stream ends or fails it SHALL reconnect with an increasing delay capped at 30 seconds, and on every successful (re)subscription after the first it SHALL invalidate the history and stacks queries, since events missed while disconnected are not replayed. Unmounting SHALL abort the subscription. It SHALL NOT subscribe during SSR.

#### Scenario: Deploy finishes while the page is open

- **WHEN** a page using the hook receives a `finished` event
- **THEN** the history and stacks queries SHALL be invalidated

#### Scenario: Backend restarts

- **WHEN** the stream drops because the backend restarted and the hook later subscribes again
- **THEN** the in-flight map SHALL be replaced by the new snapshot and the history and stacks queries SHALL be invalidated

#### Scenario: Page left

- **WHEN** the component using the hook unmounts
- **THEN** the subscription request SHALL be aborted
