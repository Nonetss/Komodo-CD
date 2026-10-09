# RPC API

## Purpose

Defines the oRPC contract shared by the dashboard and CI: one versioned router in `packages/api`, served as typed RPC at `/rpc/*` for the frontend and as REST at `/api/*` for everyone else, with a fixed folder layout per feature.

## Requirements

### Requirement: Versioned router

`packages/api/src/router.ts` SHALL export `appRouter` nesting each API version under its own key; today only `v0` (`packages/api/src/v0/router.ts`) with the features `deploy`, `credentials` (and its nested `ntfy`), `stacks`, `history` and `apiKey`. Client calls SHALL therefore read `v0.<feature>.<method>` and RPC paths `/rpc/v0/<feature>/<method>`. A new version SHALL be a new `src/<version>/` folder plus one new key in `appRouter`, leaving existing versions untouched.

#### Scenario: Typed client call

- **WHEN** the frontend calls `client.v0.stacks.list()`
- **THEN** the request SHALL go to `/rpc/v0/stacks/list` and its result SHALL be typed from `AppRouter`

### Requirement: Feature folder layout

Each feature SHALL live in `packages/api/src/<version>/<feature>/` split into `input.ts` (zod input schemas, `<feature>Input`), `output.ts` (zod output schemas, `<feature>Output`), `handler.ts` (business logic, `<feature>Handler`, methods taking one options object) and `router.ts` (oRPC wiring only: tier → `.route()` → `.input()` → `.output()` → `.handler()` calling the handler). Services that talk to Komodo or ntfy SHALL live in `packages/api/src/lib/`. Inside the package, modules SHALL be imported through the `#` subpath imports (`#*` → `./src/*.ts`, `#tests/*` → `./tests/*.ts`).

#### Scenario: Adding a procedure

- **WHEN** a developer adds a new method to the `history` feature
- **THEN** its schemas SHALL go in `history/input.ts` and `history/output.ts`, its logic in `history/handler.ts` and its wiring in `history/router.ts`

### Requirement: Validated outputs

Every procedure SHALL declare an output schema and its result SHALL be validated against it before being sent, so the declared contract (and the generated OpenAPI document) matches what clients receive.

#### Scenario: Unexpected shape from a dependency

- **WHEN** a handler returns a value that does not satisfy its output schema
- **THEN** the call SHALL fail instead of sending the invalid value

### Requirement: RPC endpoint for the dashboard

The backend SHALL serve the router with oRPC's `RPCHandler` under the `/rpc` prefix, building the context (user, session, headers, request id, request logger) from the Hono request for every call. Unmatched paths SHALL fall through to the next route. Errors that are not defined `ORPCError`s SHALL be logged with the request's logger as `rpc error`; defined errors SHALL NOT be logged again by the handler.

#### Scenario: Unexpected exception

- **WHEN** a handler throws a plain `Error`
- **THEN** the client SHALL receive an internal server error and the backend SHALL log it with the request id

### Requirement: Same-origin typed client

The frontend SHALL call the API with an oRPC `RPCLink` pointed at `${window.location.origin}/rpc` with `credentials: "include"`, and SHALL expose TanStack Query utilities generated from the router (`orpc.v0.<feature>.<method>.queryOptions()` / `mutationOptions()`). The browser SHALL never call the backend cross-origin: the gateway in production and the Vite proxy in development route `/rpc` to it. `AppRouter` SHALL be imported only as a type, so no backend code reaches the browser bundle.

#### Scenario: Cookie on RPC calls

- **WHEN** a signed-in user's page calls `orpc.v0.history.list`
- **THEN** the request SHALL go to the page's own origin carrying the session cookie
