# Project Website

## Purpose

Presents Komodo CD and documents how to install, configure and use it, as a static bilingual site published on GitHub Pages, separate from the running app.

## Requirements

### Requirement: Static site on GitHub Pages

`apps/site` SHALL be a static Astro site served under `https://nonetss.github.io/Komodo-CD/` with trailing slashes, built and deployed by the Pages workflow. It SHALL NOT be part of the running app or of its Docker images, and every internal link SHALL be built through one helper that applies the base path.

#### Scenario: Internal link

- **WHEN** a page links to the docs
- **THEN** the URL SHALL start with `/Komodo-CD/`

### Requirement: English and Spanish

The site SHALL be available in English (default, unprefixed) and Spanish (under `/es/`), with a language switcher. The documentation SHALL exist in both languages under `src/content/docs/<lang>/`, with the same pages (`index`, getting started, connect Komodo, deploy from CI, deploy with Docker Compose, configuration, REST API, architecture, upgrades and backups, development), each with a `title`, `description` and `order`. A change to a page in one language SHALL be made in the other in the same change.

#### Scenario: Spanish docs

- **WHEN** a visitor opens `/Komodo-CD/es/docs/`
- **THEN** the Spanish documentation index SHALL be shown

### Requirement: Landing page

The landing page SHALL explain what Komodo CD does, show screenshots of the dashboard (the same images as the README, from the root `img/`), describe the architecture and give the one-line install command (`curl -fsSL …/scripts/bootstrap.sh | bash`) with a copy button.

#### Scenario: Copy the install command

- **WHEN** a visitor clicks the copy button next to the install command
- **THEN** the command SHALL be copied to the clipboard and the button SHALL confirm it
