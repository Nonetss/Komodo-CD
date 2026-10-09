## MODIFIED Requirements

### Requirement: Page map

The dashboard SHALL serve these routes:

- `/`, the overview;
- `/stacks` and `/stacks/<name>`;
- `/deploy`, `/history`, `/credentials`, `/keys`;
- `/login`;
- a 404 page for anything else.

Every route except `/login` and the 404 page SHALL use the dashboard layout and require a session (see `authentication`).

#### Scenario: Root URL

- **WHEN** a signed-in user opens `/`
- **THEN** the overview SHALL be shown without a redirect

#### Scenario: Stack URL

- **WHEN** a signed-in user opens `/stacks/web`
- **THEN** the Stacks page SHALL be shown with `web` open in the detail pane

#### Scenario: Unknown URL

- **WHEN** a user opens a path that matches no page
- **THEN** the 404 page SHALL be shown with a link back to `/`

### Requirement: Single surface registry

`apps/frontend/src/lib/app-surfaces.ts` SHALL be the only list of navigable pages, in this order, each with one icon:

1. overview (`/`);
2. stacks (`/stacks`);
3. deploy (`/deploy`);
4. history (`/history`);
5. credentials (`/credentials`);
6. API keys (`/keys`).

The top bar and the bottom bar SHALL read their paths from it, the bottom bar also its icons, and their labels from the i18n key `nav.<id>`. Each dashboard page SHALL pass its surface id to the dashboard layout, which SHALL build the document title as `<nav.<id>> · Komodo CD` in the request's language.

#### Scenario: Change an icon

- **WHEN** a surface's icon is changed in the registry
- **THEN** the bottom bar SHALL show the new icon

#### Scenario: Localized page title

- **WHEN** the credentials page is opened in English
- **THEN** the document title SHALL be the English `nav.credentials` label followed by ` · Komodo CD`

### Requirement: Responsive shell

The dashboard SHALL show one sticky top bar on every screen size, closed by a heavy ink rule. It SHALL contain:

- the `KOMODO/CD` wordmark, linking to `/` and read by screen readers as "Komodo CD";
- on large screens, the navigation as a row of uppercase links;
- the language, theme and log-out controls, rendered as a single island.

On smaller screens, the top bar SHALL keep only the wordmark and the controls, and a fixed bottom tab bar SHALL show the six surfaces, respecting the device's safe-area inset.

The active item SHALL be the one whose path equals the current path or, for every surface except the overview, prefixes it. It SHALL be marked by a signal underline and `aria-current="page"`. The navigation SHALL be rendered on the server.

#### Scenario: Active item

- **WHEN** the user is on `/history`
- **THEN** the history item SHALL be underlined and carry `aria-current="page"` in both the top bar and the bottom bar

#### Scenario: Stack detail keeps stacks active

- **WHEN** the user is on `/stacks/web`
- **THEN** the stacks item SHALL be active and the overview item SHALL NOT

#### Scenario: Shell controls

- **WHEN** a dashboard page is rendered
- **THEN** the top bar SHALL contain exactly one island with the language, theme and log-out controls

### Requirement: Fast page changes

The dashboard SHALL use Astro's client router with every link prefetched on hover (or touch). On navigation, the whole page SHALL fade (0.2 s) the same way on every route, without animating the size or position of the content, also between the full-width Stacks pages and the centred ones. The top bar and the bottom bar SHALL keep their own transition names so they swap without animating.

#### Scenario: Navigate between pages

- **WHEN** the user hovers and then clicks the history link
- **THEN** the page SHALL already be prefetched and the content SHALL fade in while the top bar and the bottom bar stay still
