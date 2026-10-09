# Frontend Architecture

## Purpose

Defines how the dashboard is built: Astro SSR pages that mount React islands, features organized by domain, a shared query cache across islands, hydration-safe data fetching and the reuse rules for components.

## Requirements

### Requirement: SSR pages with React islands

The frontend SHALL be an Astro server-rendered app (Node standalone adapter) whose pages in `src/pages/` are thin: they pick the layout, read the language and mount one page island from a feature. Each island SHALL be wrapped with `withIsland` (`src/providers/island.tsx`), which provides the i18n instance for the request's language and the shared TanStack Query client. Fonts (Space Grotesk and Space Mono) SHALL be self-hosted, Latin subset, with metric-adjusted fallbacks.

#### Scenario: New page

- **WHEN** a developer adds a dashboard page
- **THEN** its `.astro` file SHALL only mount the feature's island inside the dashboard layout, passing the language

### Requirement: Feature folders

Domain code SHALL live in `src/features/<domain>/` (`api-keys`, `app-shell`, `auth`, `credentials`, `deploy`, `history`, `not-found`, `stacks`), each with technical subfolders it actually uses (`components/`, `hooks/`, `model/`) and an `index.ts` that is the feature's public entry point. Pages and other features SHALL import a feature through its `index.ts`, except for cache keys and hooks shared on purpose. Cross-feature helpers SHALL live in `src/lib/`, cross-feature hooks in `src/hooks/`, shadcn/ui primitives in `src/components/ui/` and reusable visual patterns in `src/components/shared/`. Before writing a new component, hook or helper, the existing ones SHALL be searched and reused when they fit.

#### Scenario: Reusing the stack state dot

- **WHEN** the Deploy page needs to show a stack's state
- **THEN** it SHALL import `StackStateDot` from `@/features/stacks` instead of re-implementing it

### Requirement: Shared, hydration-safe queries

There SHALL be one `QueryClient` per browser tab, shared by every island on the page, and one per request on the server. Queries SHALL consider data fresh for 30 seconds, SHALL NOT refetch on window focus and SHALL retry only network failures (up to twice), never oRPC errors. Islands SHALL read data with `useHydratedQuery`, which reports a pending state until the island has hydrated so the client's first render matches the server HTML, and then uses the shared cache. Mutations SHALL invalidate the queries they affect (a deploy invalidates stacks and history; saving or deleting the connection invalidates credentials and stacks).

#### Scenario: Error from the backend

- **WHEN** `v0.stacks.list` answers `503`
- **THEN** the query SHALL fail immediately without retries and the page SHALL show the error state

#### Scenario: Hydration

- **WHEN** an island hydrates while the shared cache already holds its data
- **THEN** the first client render SHALL match the server's pending markup and the cached data SHALL appear right after

### Requirement: Feedback conventions

Results of user actions SHALL be reported with toasts (`notifySuccess`, `notifyError`), using the backend's error message when the error comes from oRPC. Destructive actions (deleting the connection, the ntfy configuration or an API key) SHALL require a second click on the same button within 3 seconds. Lists SHALL show skeletons while loading, and empty and error states through the shared state card.

#### Scenario: Error toast

- **WHEN** saving the ntfy configuration fails with a `BAD_REQUEST` carrying a message
- **THEN** the error toast SHALL show that message
