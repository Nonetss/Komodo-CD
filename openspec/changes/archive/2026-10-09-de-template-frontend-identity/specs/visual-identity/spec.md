## MODIFIED Requirements

### Requirement: Typography

The dashboard SHALL use two self-hosted families:

- **Archivo**, variable in width and weight, for UI text and headings. Only the page title SHALL be set at an expanded width and a heavy weight; section titles and figures SHALL use the normal width.
- **JetBrains Mono** for data and chrome: commit hashes, image references, `repo@branch`, counts in lists, code and `curl` snippets, status words, navigation and filter options, and the small uppercase labels of counters.

Descriptive names — form labels, the field names of a metadata block, headings of explanatory blocks — SHALL be set in Archivo in sentence case, not in tracked uppercase mono.

No other family SHALL be loaded.

#### Scenario: Page title

- **WHEN** any dashboard page is rendered
- **THEN** its title SHALL be set in Archivo at an expanded width, and any commit hash on the page SHALL be set in JetBrains Mono

#### Scenario: Section title and figures

- **WHEN** a section title or a counter figure is rendered
- **THEN** it SHALL be set in Archivo at the normal width

#### Scenario: Form label

- **WHEN** a form field with a label is rendered
- **THEN** the label SHALL be set in Archivo in sentence case, not in uppercase mono

### Requirement: Light and dark palettes

Colours SHALL be defined only as CSS custom properties in `apps/frontend/src/styles/global.css`, with one set for the light theme and one for the dark theme. Components SHALL use these tokens and SHALL NOT hard-code colour values.

- The **light** palette SHALL be warm paper and ink: an off-white ground with a warm tint, near-black warm text and heavy rules, a warm grey for secondary text and a light warm grey for hairlines. The ground SHALL NOT be pure white.
- The **dark** palette SHALL invert it: a warm ink ground, paper text and dark warm hairlines.

Both palettes SHALL define the state colours (`success`, `info`, `warning`, `danger`). In both themes, body and secondary text SHALL reach a 4.5:1 contrast with the ground.

#### Scenario: No hard-coded colours

- **WHEN** the frontend components are searched for hex, `rgb()` or `oklch()` colour literals
- **THEN** no match SHALL be found outside `styles/global.css`

#### Scenario: Secondary text contrast

- **WHEN** secondary text is rendered on the ground in either theme
- **THEN** its contrast ratio SHALL be at least 4.5:1

#### Scenario: Warm ground

- **WHEN** the page ground is read in the light theme
- **THEN** it SHALL have a non-zero chroma and a lightness below 1

### Requirement: Signal accent

The palette SHALL have one orange signal accent, lighter in the dark theme. It SHALL be used only for what needs action or orientation:

- problem states and the needs-attention counter;
- pending updates and the commit or image they would deploy;
- the main action when it would deploy something new;
- the active navigation and filter marker and the focus ring.

Section numbers SHALL NOT use the signal accent; they SHALL be set in the muted tone. Ordinary primary buttons SHALL be ink on paper (paper on ink in the dark theme), not orange. The `danger` state colour SHALL be the signal accent.

#### Scenario: Up-to-date stack

- **WHEN** the detail of a stack without updates is shown
- **THEN** its pull + redeploy button SHALL use the ink primary style

#### Scenario: Stack with an update

- **WHEN** the detail of a stack with an image update is shown
- **THEN** its pull + redeploy button and the updated image tag SHALL use the signal accent

#### Scenario: Section number

- **WHEN** an overview section header shows its number
- **THEN** the number SHALL be in the muted tone, not the signal accent

## ADDED Requirements

### Requirement: Numbers only for ranked sections

A section header SHALL show a number only when its sections are ranked in a meaningful order. The overview sections (needs attention, something new, running, stopped) are ranked by urgency and SHALL be numbered. The sections of a stack detail SHALL NOT be numbered.

#### Scenario: Overview sections

- **WHEN** the overview renders its sections
- **THEN** each section header SHALL show its position as a two-digit number

#### Scenario: Stack detail sections

- **WHEN** the detail of a stack renders its services and CI sections
- **THEN** their headers SHALL show no number
