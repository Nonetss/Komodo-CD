## RENAMED Requirements

- FROM: `### Requirement: Dark by default, remembered per browser`
- TO: `### Requirement: Light by default, remembered per browser`

## MODIFIED Requirements

### Requirement: Light by default, remembered per browser

The dashboard SHALL render in the light theme unless the browser's `localStorage` key `theme` is `dark`, in which case `<html>` SHALL carry the `dark` class. An inline script in the document head SHALL apply the stored theme before the first paint and again on every client-router page swap.

#### Scenario: First visit

- **WHEN** a browser with no stored theme opens the dashboard
- **THEN** the light theme SHALL be shown

#### Scenario: Stored dark theme

- **WHEN** a browser with `theme=dark` navigates between pages
- **THEN** every page SHALL render in the dark theme without a light flash
