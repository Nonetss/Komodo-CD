## MODIFIED Requirements

### Requirement: Two languages with Spanish as default

The dashboard SHALL support Spanish (`es`) and English (`en`), with Spanish as the default and fallback. All UI copy, including accessible labels, tooltips, page titles and example values shown in the UI, SHALL come from the dictionaries `apps/frontend/src/locales/es.ts` and `apps/frontend/src/locales/en.ts`; copy SHALL NOT be hard-coded in components, layouts or pages. The Spanish dictionary SHALL be the reference shape: the English dictionary SHALL be type-checked against it so a missing or extra key fails `bun run check-types`, and translation keys passed to `t()` and `<Trans>` SHALL be type-checked so an unknown key fails `bun run check-types`.

#### Scenario: First visit

- **WHEN** a browser without a `lang` cookie opens the dashboard
- **THEN** the UI SHALL be in Spanish

#### Scenario: Missing English key

- **WHEN** a developer adds a key to `es.ts` but not to `en.ts`
- **THEN** `bun run check-types` SHALL fail

#### Scenario: Unknown translation key

- **WHEN** a component calls `t("stacks.doesNotExist")`
- **THEN** `bun run check-types` SHALL fail

#### Scenario: Theme toggle label

- **WHEN** the dashboard is shown in English
- **THEN** the theme toggle's accessible label and tooltip SHALL be in English
