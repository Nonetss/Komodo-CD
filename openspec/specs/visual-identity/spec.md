# Visual Identity

## Purpose

The dashboard's editorial look: Archivo and JetBrains Mono, paper and ink palettes for light and dark, rules instead of cards, square corners and one signal accent for what needs action, all carried by tokens and shared components.

## Requirements
### Requirement: Typography

The dashboard SHALL use two self-hosted families:

- **Archivo**, variable in width and weight, for UI text and headings. Page titles SHALL be set at an expanded width and a heavy weight.
- **JetBrains Mono** for data and labels: commit hashes, image references, `repo@branch`, counts in lists, code and `curl` snippets, and the small uppercase labels of sections, table headers and filters.

No other family SHALL be loaded.

#### Scenario: Page title

- **WHEN** any dashboard page is rendered
- **THEN** its title SHALL be set in Archivo at an expanded width, and any commit hash on the page SHALL be set in JetBrains Mono

### Requirement: Light and dark palettes

Colours SHALL be defined only as CSS custom properties in `apps/frontend/src/styles/global.css`, with one set for the light theme and one for the dark theme. Components SHALL use these tokens and SHALL NOT hard-code colour values.

- The **light** palette SHALL be paper and ink: a white ground, near-black text and heavy rules, a warm grey for secondary text and a light grey for hairlines.
- The **dark** palette SHALL invert it: an ink ground, paper text and dark hairlines.

Both palettes SHALL define the state colours (`success`, `info`, `warning`, `danger`). In both themes, body and secondary text SHALL reach a 4.5:1 contrast with the ground.

#### Scenario: No hard-coded colours

- **WHEN** the frontend components are searched for hex, `rgb()` or `oklch()` colour literals
- **THEN** no match SHALL be found outside `styles/global.css`

#### Scenario: Secondary text contrast

- **WHEN** secondary text is rendered on the ground in either theme
- **THEN** its contrast ratio SHALL be at least 4.5:1

### Requirement: Signal accent

The palette SHALL have one orange signal accent, lighter in the dark theme. It SHALL be used only for what needs action or orientation:

- problem states and the needs-attention counter;
- pending updates and the commit or image they would deploy;
- the main action when it would deploy something new;
- the active navigation and filter marker, the focus ring and section numbers.

Ordinary primary buttons SHALL be ink on paper (paper on ink in the dark theme), not orange. The `danger` state colour SHALL be the signal accent.

#### Scenario: Up-to-date stack

- **WHEN** the detail of a stack without updates is shown
- **THEN** its pull + redeploy button SHALL use the ink primary style

#### Scenario: Stack with an update

- **WHEN** the detail of a stack with an image update is shown
- **THEN** its pull + redeploy button and the updated image tag SHALL use the signal accent

### Requirement: Rules instead of cards

The layout SHALL separate content with rules, not boxes:

- a heavy ink rule under page headers, section headers and the navigation;
- a hairline between list items and table rows.

Buttons, inputs, list items and containers SHALL have square corners. Shadows SHALL be reserved for elements that float above the page (toasts, popovers, the bulk action bar). Tinted or rounded cards SHALL NOT be used to group content.

#### Scenario: Section header

- **WHEN** a section with a title is rendered
- **THEN** its header SHALL sit on a heavy ink rule and its items SHALL be separated by hairlines without card backgrounds

### Requirement: Shared components carry the look

The visual identity SHALL live in the shadcn primitives in `src/components/ui/` and the shared patterns in `src/components/shared/`: `Button`, `Input`, `Segmented`, `StatusDot` and `StatusTag`, `PageHero`, `CodeBlock`, list, state and error cards, and the app shell. Feature components SHALL compose them and SHALL NOT restyle them with their own colours, radii or fonts. A page that is not redesigned SHALL adopt the identity through these components alone.

#### Scenario: History page

- **WHEN** the History page is rendered after the change, with its layout unchanged
- **THEN** it SHALL show the new typography, palette and square shapes

