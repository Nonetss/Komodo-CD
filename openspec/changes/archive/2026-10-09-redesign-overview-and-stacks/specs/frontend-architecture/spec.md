## MODIFIED Requirements

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

Domain pieces used by more than one feature SHALL live in `src/entities/<entity>/` (`stack`, `deploy-action`), with the same subfolder rules and an `index.ts`. This includes the stack grouping rules and the bulk deploy runner, which both the overview and the Stacks page use.

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
