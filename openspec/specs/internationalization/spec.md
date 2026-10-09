# Internationalization

## Purpose

Shows the dashboard in Spanish or English, chosen per browser with a cookie, rendered on the server in that language and hydrated without mismatches.

## Requirements

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

### Requirement: Language from a cookie

The language of each request SHALL be read from the `lang` cookie (`en` selects English; any other value selects Spanish) and SHALL set the `<html lang>` attribute and the language of every React island rendered for that request. The language switcher SHALL set `lang` for one year on path `/` and reload the page. Each language SHALL use its own i18next instance, so concurrent SSR requests in different languages never affect each other.

#### Scenario: Switch to English

- **WHEN** the user clicks the language switcher while in Spanish
- **THEN** the `lang=en` cookie SHALL be set and the reloaded page SHALL be in English, both in the server HTML and after hydration

#### Scenario: Concurrent requests

- **WHEN** two requests with `lang=es` and `lang=en` are rendered at the same time
- **THEN** each response SHALL be entirely in its own language

### Requirement: Localized formatting

Dates and relative times SHALL be formatted with `Intl` in the active language.

#### Scenario: Relative time in English

- **WHEN** the History page is shown in English for an entry from two minutes ago
- **THEN** its time SHALL read `2 minutes ago`
