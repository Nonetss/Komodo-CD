## MODIFIED Requirements

### Requirement: Single surface registry

`apps/frontend/src/lib/app-surfaces.ts` SHALL be the only list of navigable pages, in this order: stacks (`/stacks`), deploy (`/deploy`), history (`/history`), credentials (`/credentials`) and API keys (`/keys`), each with one icon. The sidebar, the bottom bar and each page's header SHALL read their path and icon from it, and their labels from the i18n key `nav.<id>`. Each dashboard page SHALL pass its surface id to the dashboard layout, which SHALL build the document title as `<nav.<id>> · Komodo CD` in the request's language.

#### Scenario: Change an icon

- **WHEN** a surface's icon is changed in the registry
- **THEN** the sidebar, the bottom bar and that page's header SHALL all show the new icon

#### Scenario: Localized page title

- **WHEN** the credentials page is opened in English
- **THEN** the document title SHALL be the English `nav.credentials` label followed by ` · Komodo CD`

### Requirement: Responsive shell

On large screens the dashboard SHALL show a fixed sidebar with the logo (linking to `/stacks`), the navigation, the signed-in user's initial, name and email, and the language, theme and log-out controls. On smaller screens it SHALL show a sticky top bar with the logo and the same controls, and a fixed bottom tab bar with the five surfaces that respects the device's safe-area inset. The language, theme and log-out controls SHALL be rendered as a single island per position (sidebar and top bar). The active item SHALL be the one whose path equals or prefixes the current path, highlighted and marked with `aria-current="page"`. The navigation SHALL be rendered on the server.

#### Scenario: Active item

- **WHEN** the user is on `/history`
- **THEN** the history item SHALL be highlighted and carry `aria-current="page"` in both the sidebar and the bottom bar

#### Scenario: Shell controls

- **WHEN** a dashboard page is rendered
- **THEN** the sidebar and the top bar SHALL each contain one island with the language, theme and log-out controls
