# Internationalization

## Purpose

Shows the dashboard in Spanish or English, chosen per browser with a cookie, rendered on the server in that language and hydrated without mismatches.

## Requirements

### Requirement: Two languages with Spanish as default

The dashboard SHALL support Spanish (`es`) and English (`en`), with Spanish as the default and fallback. All UI copy SHALL come from the dictionaries `apps/frontend/src/locales/es.ts` and `apps/frontend/src/locales/en.ts`, which SHALL define the same keys; copy SHALL NOT be hard-coded in components.

#### Scenario: First visit

- **WHEN** a browser without a `lang` cookie opens the dashboard
- **THEN** the UI SHALL be in Spanish

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
