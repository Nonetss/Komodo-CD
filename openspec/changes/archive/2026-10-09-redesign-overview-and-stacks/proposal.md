## Why

The dashboard opens on a flat list of stacks: to find out what needs doing, the user has to scan every row, filter by "problems" and expand stacks one by one to see what has an update. A root page that answers "what needs my attention?" at a glance, plus a stacks page built for inspecting one stack at a time, fits the way the app is used. The visual identity (cool slate, Komodo blue, Space Grotesk) is also being replaced with an editorial one that was chosen from design explorations.

## What Changes

- New **overview page at `/`** (it no longer redirects to `/stacks`). It shows the instance, counters (needs attention, updates, running, total) and the stacks grouped by urgency in numbered sections: *needs attention* (each one with the reason and a suggested action), *something new to deploy* (what changes per service and the commit diff, with per-stack actions and one "pull + redeploy all N" bulk action), *running and up to date* and *stopped*. Every stack name links to its page.
- **BREAKING (UI)**: **`/stacks` becomes master–detail.** It has a list pane with search, group filters, selection and the bulk bar, and a detail pane for the stack at **`/stacks/<name>`**: state, repo and branch, the pull / redeploy / pull + redeploy actions, the problem message, deployed vs latest commit, a services table and the CI `curl` snippet. The list stays in place (with its selection) while the user moves between stacks. On small screens the list and the detail are shown one at a time.
- **BREAKING (UI)**: stack rows no longer expand in place, and the per-row action buttons move from the list to the detail pane header (and to the overview rows). Bulk selection and the bulk bar stay as they are.
- New navigation surface **overview** (`/`), first in the sidebar and the bottom bar. The logo and the 404 page link to `/`. The overview item is active only on `/` itself.
- **New visual identity across the whole app**: Archivo (variable width) + JetBrains Mono replace Space Grotesk + Space Mono. The palette is paper / ink with hairline and heavy rules, square corners and one orange signal accent used only for what needs action. Shared components (`Button`, `Input`, `Segmented`, `StatusTag`, `PageHero`, `CodeBlock`, list and card patterns, the shell) are restyled, so the deploy, history, connection and API key pages adopt it without being redesigned.
- **BREAKING (UX)**: **Light theme by default.** Dark becomes the alternative, with its own editorial palette (ink ground, paper text, a lighter orange). The toggle, its storage and the no-flash script stay.
- Shared stack logic moves into entities so the overview and the stacks page can both use it: grouping (`hasProblem`, `hasUpdate`, `inGroup`, the problem reason), `ImageRef` and the bulk runner (`runPool` plus the "run on N stacks, one summary toast" flow).
- No API, backend or database change. **No database migration is needed.**

## Capabilities

### New Capabilities

- `dashboard-overview`: the root page that groups stacks by urgency, explains why a stack needs attention and runs single or bulk actions on what is pending.
- `visual-identity`: typography, the light and dark palettes, the role of the signal accent, the shape rules (rules instead of cards, square corners) and the rule that shared components carry the look, not individual pages.

### Modified Capabilities

- `stacks-overview`: the Stacks page becomes master–detail with a per-stack URL (`/stacks/<name>`). Stack details move from an expandable row to the detail pane, single-stack actions move to the detail pane, and the page is no longer the landing page.
- `web-navigation`: the page map gains `/` as the overview and `/stacks/<name>`, the surface registry gains `overview` first, the logo and 404 point to `/`, and the active rule exempts `/` from prefix matching.
- `theme-switching`: light is the default and dark the stored alternative.
- `frontend-architecture`: the fonts become Archivo + JetBrains Mono, and the feature list gains `overview`.

## Impact

- **Frontend** (`apps/frontend/src`):
  - `pages/index.astro` (now mounts the overview), `pages/stacks/index.astro` and a new `pages/stacks/[name].astro`.
  - A new `features/overview/`. `features/stacks/` is reworked into list and detail panes.
  - `entities/stack` and `entities/deploy-action` gain the moved grouping and bulk logic.
  - `lib/app-surfaces.ts`, `features/app-shell/`, `features/not-found/`, `layouts/main.astro` (default theme, fonts), `styles/global.css` (tokens) and `astro.config.mjs` (fonts).
  - The restyled shared components in `components/ui/` and `components/shared/`.
  - New copy in `locales/es.ts` and `en.ts`.
- **Backend, API, gateway, database**: unchanged. `v0.stacks.list`, `v0.deploy.trigger` and the deploy events subscription are reused as they are.
- **Docs**: the README and site screenshots of the stacks page (`img/stacks.png`, `img/stacks-light.png`) and the site's stacks screen alt text become outdated. New screenshots are taken by the user from the running app.
