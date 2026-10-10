# Web Navigation

## Purpose

Defines the dashboard's page map and its shell: a top bar with the wordmark, the navigation on desktop, a search palette and the controls, a bottom tab bar on mobile, both driven by one registry of surfaces, fast page changes with prefetching and one page fade, and the 404 page.

## Requirements
### Requirement: Page map

The dashboard SHALL serve these routes:

- `/`, the overview;
- `/stacks` and `/stacks/<name>`;
- `/deploy`, `/history`, `/security`, `/credentials`, `/keys`;
- `/login`;
- a 404 page for anything else.

Every route except `/login` and the 404 page SHALL use the dashboard layout and require a session (see `authentication`).

#### Scenario: Root URL

- **WHEN** a signed-in user opens `/`
- **THEN** the overview SHALL be shown without a redirect

#### Scenario: Stack URL

- **WHEN** a signed-in user opens `/stacks/web`
- **THEN** the Stacks page SHALL be shown with `web` open in the detail pane

#### Scenario: Security URL

- **WHEN** a signed-in user opens `/security`
- **THEN** the Security page SHALL be shown

#### Scenario: Unknown URL

- **WHEN** a user opens a path that matches no page
- **THEN** the 404 page SHALL be shown with a link back to `/`
### Requirement: Single surface registry

`apps/frontend/src/lib/app-surfaces.ts` SHALL be the only list of navigable pages, in this order, each with one icon:

1. overview (`/`);
2. stacks (`/stacks`);
3. deploy (`/deploy`);
4. history (`/history`);
5. security (`/security`);
6. credentials (`/credentials`);
7. API keys (`/keys`).

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
- the search trigger: a search field on large screens, a search button on smaller ones (see "Search palette");
- the language, theme and log-out controls, rendered as a single island.

On smaller screens, the top bar SHALL keep only the wordmark, the search button and the controls, and a fixed bottom tab bar SHALL show the seven surfaces, respecting the device's safe-area inset, without horizontal scrolling at a 360 px viewport.

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

#### Scenario: Seven tabs on a phone

- **WHEN** the dashboard is opened on a 360 px wide screen
- **THEN** the bottom tab bar SHALL show all seven surfaces without scrolling horizontally
### Requirement: Fast page changes

The dashboard SHALL use Astro's client router with every link prefetched on hover (or touch). On navigation, the whole page SHALL fade (0.2 s) the same way on every route, without animating the size or position of the content, also between the full-width Stacks pages and the centred ones. The top bar and the bottom bar SHALL keep their own transition names so they swap without animating.

#### Scenario: Navigate between pages

- **WHEN** the user hovers and then clicks the history link
- **THEN** the page SHALL already be prefetched and the content SHALL fade in while the top bar and the bottom bar stay still

### Requirement: Search palette

The top bar SHALL hold a search palette, rendered as its own island with its triggers: on large screens a field showing the `⌘K` (Apple platforms) or `Ctrl K` shortcut, on smaller screens a search button. A trigger click or `⌘K` / `Ctrl+K` anywhere on the page SHALL open it as a dialog; the shortcut SHALL toggle it, and `Escape`, the `esc` key cap next to the input or a click outside SHALL close it and clear the text.

It SHALL list:

- with an empty query, under "Recent", the last five surfaces the user visited (exact surface paths only, the current one left out), stored in `localStorage` per user, and an unreadable store SHALL count as empty;
- under "Pages", the seven surfaces with their icon, label and page description;
- once the user types, under "Stacks", the stacks with their state dot and service count, sorted by name. `v0.stacks.list` SHALL be loaded only while the palette is open.

A result SHALL match when every word of the query is contained in its name, description or group name, ignoring case and accents. The arrow keys SHALL move through the results, wrapping around, and `Enter` or a click SHALL close the palette and open the result. The current page (or, on `/stacks/<name>`, that stack) SHALL be marked as current and choosing it SHALL only close the palette. When nothing matches, the palette SHALL say so, or that the stacks are loading while they are. On screens of at least 640 px, a footer SHALL list the keys.

#### Scenario: Jump to a stack

- **WHEN** the user presses `Ctrl+K`, types "git" and presses `Enter` on `gitea`
- **THEN** the palette SHALL close and `/stacks/gitea` SHALL open

#### Scenario: Words and accents

- **WHEN** the user types "conexion"
- **THEN** the connection page ("Conexión") SHALL be listed

#### Scenario: Recent pages

- **WHEN** the user visited `/history` and then `/keys`, and opens the palette on `/` with no text
- **THEN** "Recent" SHALL list API Keys and then History

#### Scenario: No match

- **WHEN** the user types a text that no page or stack matches
- **THEN** the palette SHALL say there are no results for that text
