# Theme Switching

## Purpose

Offers a dark theme by default and a light theme, remembered per browser and applied before the first paint so the page never flashes the wrong theme.

## Requirements

### Requirement: Dark by default, remembered per browser

The dashboard SHALL render with the `dark` class on `<html>` unless the browser's `localStorage` key `theme` is `light`. An inline script in the document head SHALL apply the stored theme before the first paint and again on every client-router page swap.

#### Scenario: First visit

- **WHEN** a browser with no stored theme opens the dashboard
- **THEN** the dark theme SHALL be shown

#### Scenario: Stored light theme

- **WHEN** a browser with `theme=light` navigates between pages
- **THEN** every page SHALL render in the light theme without a dark flash

### Requirement: Theme toggle

The theme toggle, available in the dashboard shell and on the login page, SHALL switch between dark and light and store the choice in `localStorage`. When the browser supports view transitions and the user has not asked for reduced motion, the new theme SHALL be revealed with a 400 ms circular clip expanding from the click point; otherwise it SHALL switch instantly. The reveal SHALL be scoped so it never alters the fade of ordinary page navigations.

#### Scenario: Reduced motion

- **WHEN** a user with `prefers-reduced-motion: reduce` clicks the toggle
- **THEN** the theme SHALL switch instantly without the circular animation
