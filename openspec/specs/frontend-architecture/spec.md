# Frontend Architecture

## Purpose

Defines how the dashboard is built: Astro SSR pages that mount React islands, features organized by domain, a shared query cache across islands, hydration-safe data fetching and the reuse rules for components.
## Requirements
### Requirement: SSR pages with React islands

The frontend SHALL be an Astro server-rendered app (Node standalone adapter) whose pages in `src/pages/` are thin: they pick the layout and mount one page island from a feature. The request's language SHALL be resolved once per request by the middleware into `Astro.locals.lang`, and pages and layouts SHALL read it from there instead of parsing the cookie themselves. Each island SHALL be wrapped with `withIsland` (`src/providers/island.tsx`), which provides the i18n instance for the request's language (defaulting to `DEFAULT_LANG`) and the shared TanStack Query client. Fonts (Archivo, variable in width and weight, and JetBrains Mono) SHALL be self-hosted, Latin subset, with metric-adjusted fallbacks.

#### Scenario: New page

- **WHEN** a developer adds a dashboard page
- **THEN** its `.astro` file SHALL only mount the feature's island inside the dashboard layout, passing `Astro.locals.lang`

#### Scenario: Language resolved once

- **WHEN** a request with the cookie `lang=en` reaches any page, public or protected
- **THEN** `Astro.locals.lang` SHALL be `en` before the page renders

### Requirement: Feature folders

Domain code SHALL live in `src/features/<domain>/`: `api-keys`, `app-shell`, `auth`, `credentials`, `deploy`, `history`, `not-found`, `overview` and `stacks`. Each feature SHALL have only the technical subfolders it actually uses (`components/`, `hooks/`, `model/`) and an `index.ts` that is the feature's public entry point.

Domain pieces used by more than one feature SHALL live in `src/entities/<entity>/` (`stack`, `deploy-action`, `image-scan`), with the same subfolder rules and an `index.ts`. This includes the stack grouping rules and the bulk deploy runner, which both the overview and the Stacks page use, and the image scan table with its vulnerabilities, which both the Security page and the stack detail use.

Imports SHALL follow these rules:

- A feature SHALL NOT import from another feature. It SHALL import entities through their `index.ts`, plus `src/lib/`, `src/hooks/`, `src/components/` and `src/providers/`.
- Entities SHALL NOT import features.
- Pages SHALL import a feature through its `index.ts`.

Cross-feature helpers SHALL live in `src/lib/`, cross-feature hooks in `src/hooks/`, shadcn/ui primitives in `src/components/ui/` and reusable visual patterns in `src/components/shared/`. Before writing a new component, hook or helper, the existing ones SHALL be searched and reused when they fit.

#### Scenario: Reusing the stack state dot

- **WHEN** the Deploy page needs to show a stack's state
- **THEN** it SHALL import `StackStateDot` from `@/entities/stack` instead of re-implementing it or importing `@/features/stacks`

#### Scenario: Sharing the grouping rules

- **WHEN** the overview needs to know which stacks have a problem or an update
- **THEN** it SHALL import those rules from `@/entities/stack`, the same ones the Stacks page uses

#### Scenario: No cross-feature imports

- **WHEN** the frontend sources are searched for imports of `@/features/` inside `src/features/` and `src/entities/`
- **THEN** the only matches SHALL be imports of a file inside the importing feature's own folder

### Requirement: Shared, hydration-safe queries

There SHALL be one `QueryClient` per browser tab, shared by every island on the page, and one per request on the server. Queries SHALL consider data fresh for 30 seconds, SHALL NOT refetch on window focus and SHALL retry only network failures (up to twice), never oRPC errors. Islands SHALL read data with `useHydratedQuery`, which reports a pending state until the island has hydrated so the client's first render matches the server HTML, and then uses the shared cache. Mutations SHALL invalidate the queries they affect (a deploy invalidates stacks and history; saving or deleting the connection invalidates credentials and stacks).

#### Scenario: Error from the backend

- **WHEN** `v0.stacks.list` answers `503`
- **THEN** the query SHALL fail immediately without retries and the page SHALL show the error state

#### Scenario: Hydration

- **WHEN** an island hydrates while the shared cache already holds its data
- **THEN** the first client render SHALL match the server's pending markup and the cached data SHALL appear right after

### Requirement: Feedback conventions

Results of user actions SHALL be reported with toasts (`notifySuccess`, `notifyError`), using the backend's error message when the error comes from oRPC; mutations that only report their outcome SHALL go through the shared `toastMutation` helper (`src/lib/toast.ts`). Destructive actions (deleting the connection, the ntfy configuration or an API key) SHALL require a second click on the same button within 3 seconds, implemented with the shared `useConfirm` hook. Buttons that start a request SHALL show their pending state through the `Button` `loading` prop. Lists SHALL show skeletons while loading, empty states through the shared state card, and query errors through the shared `QueryErrorCard`, which shows the backend's message and a retry button.

#### Scenario: Error toast

- **WHEN** saving the ntfy configuration fails with a `BAD_REQUEST` carrying a message
- **THEN** the error toast SHALL show that message

#### Scenario: Confirmation expires

- **WHEN** the user clicks delete on an API key once and waits more than 3 seconds
- **THEN** the button SHALL return to its initial state and the next click SHALL ask for confirmation again

#### Scenario: Query error with retry

- **WHEN** `v0.history.list` fails and the History page shows its error card
- **THEN** the card SHALL show the backend's error message and clicking retry SHALL refetch the query

