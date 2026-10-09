## 1. Spike: persisted island and fonts

- [x] 1.1 Add `pages/stacks/[name].astro` and give the Stacks island `transition:persist="stacks-page"` plus a `stack` prop on both stacks pages. Temporarily log the prop and keep a local counter, and ask the user to check in the browser that `/stacks/a` → `/stacks/b` keeps the state and updates the prop, and that back/forward works.
  - Checked in the sources instead of with a temporary counter. On a swap, Astro copies the new `props` onto the persisted `astro-island`, and `@astrojs/react` re-renders the same root (`root.render`), so state survives and the `stack` prop updates. The browser confirmation is part of 8.3.
- [x] 1.2 If 1.1 fails, switch to the fallback in design.md (one route with `history.pushState` + `popstate`) and note it in design.md.
  - Not needed: 1.1 holds.
- [x] 1.3 Swap the fonts in `astro.config.mjs` to Archivo (variable, `100 900`, width axis) and JetBrains Mono, rename the CSS variables and update the `<Font>` preloads in `layouts/main.astro`. Confirm that the generated `@font-face` exposes the `wdth` axis; if not, apply the `fontProviders.local()` fallback from design.md.
  - With a weight range, unifont's fontsource provider serves Archivo's `standard` variable file, which has the `wdth` axis. The `@font-face` declares no `font-stretch` range, so the width is requested with `font-variation-settings` through the `type-expanded` / `type-semi-expanded` utilities. These are named `type-*` so tailwind-merge does not mistake them for `font-*` classes.

## 2. Shared stack and deploy logic

- [x] 2.1 Move `stack-groups.ts` to `entities/stack/model/` and add `problemKind(stack)` and `urgency(stack)`. Export them from `entities/stack/index.ts`.
- [x] 2.2 Move `ImageRef` to `entities/stack/components/` and export it.
- [x] 2.3 Move `run-pool.ts` to `entities/deploy-action/model/`, and extract `useDeployRunner()` (`runningAction`, `run`, `runBulk`) from `stacks-page.tsx` into `entities/deploy-action/hooks/`. It merges `useDeployEvents()`, keeps `toastMutation` for single runs and gives one summary toast for bulk runs. Export it.
- [x] 2.4 Create `InlineConfirm` in `components/shared/feedback/` and make `StacksBulkBar` use it.
- [x] 2.5 Create `SectionHeader` (number, title, trailing slot, heavy rule) in `components/shared/layout/`, and rework `HeroCount` into a shared `StatStrip`.

## 3. Visual identity

- [x] 3.1 Rewrite the light (`:root`) and dark (`.dark`) tokens in `styles/global.css` with the editorial palette from design.md:
  - `--radius: 0`;
  - new `--signal` and `--rule` tokens;
  - `--danger` aliasing `--signal`;
  - `--font-sans` / `--font-mono` pointing at Archivo / JetBrains Mono;
  - a larger `--text-display`;
  - updated syntax colours for `CodeBlock`.

  Check that text reaches 4.5:1 contrast in both themes.
- [x] 3.2 Make light the default: change the inline theme script in `layouts/main.astro` to `stored === "dark"`, and set `<meta name="color-scheme">` to `light dark`.
- [x] 3.3 Restyle the primitives in `components/ui/`:
  - `Button`: square, ink `default`, 1.5px `outline`, new `signal` variant;
  - `Input`: underline;
  - `Skeleton`.
- [x] 3.4 Restyle the shared patterns:
  - `Segmented`: mono uppercase, signal underline;
  - `StatusDot` and `StatusTag`: mono uppercase, hollow neutral dot;
  - `PageHero`: kicker, expanded title, heavy rule;
  - `CodeBlock`: ink block;
  - `SoftCardList`: ruled list;
  - `StateCard`, `QueryErrorCard`, `Panel`, `RefreshButton`, `CopyButton`;
  - the toaster.
- [x] 3.5 Restyle the shell: the sidebar, mobile top bar and `BottomNav` with heavy rules, uppercase nav labels and a signal marker for the active item, and the logo block in `layouts/dashboard.astro`.
- [x] 3.6 Audit `src/features/` and `src/entities/` for colour literals, primary tints (`bg-primary/…`, `text-primary` used as decoration) and `rounded-*` classes, and move them onto the shared components or tokens. This covers the deploy, history, credentials, API keys, login and 404 pages.

- [x] 3.7 Replace the desktop sidebar with the design's top navbar: one sticky header for every size in `layouts/dashboard.astro` (the `KOMODO/CD` wordmark, `TopNav` from `lg`, one `ShellControls` island), with the six-tab `BottomNav` kept below `lg`. Drop `SidebarNav` and the `layout` prop of `ShellControls`, merge the transition names into `top-bar`, and remove the `lg:pl-60` offset.

## 4. Navigation and routes

- [x] 4.1 Add the `overview` surface (`/`, `LayoutDashboard` icon) first in `lib/app-surfaces.ts` and `SurfaceId`. Add `nav.overview` to `locales/es.ts` ("Resumen") and `en.ts` ("Overview").
- [x] 4.2 In `app-nav.tsx`, make `isActive` match `/` only exactly, and give `BottomNav` six columns.
- [x] 4.3 Point the logo link in `layouts/dashboard.astro` and the 404 page link to `/`. Replace the redirect in `pages/index.astro` with the overview island (surface `overview`).

## 5. Stacks page: master–detail

- [x] 5.1 Split `stacks-page.tsx` into the island (search, group, selection, `useDeployRunner`, open stack from the `stack` prop, `data-open` for the responsive panes) and the `StackList` / `StackListItem` components:
  - checkbox, state dot, name, service count;
  - problem and update markers;
  - running indicator;
  - `<a href="/stacks/<encoded name>">` with `aria-current="page"`.
- [x] 5.2 Build `StackDetail`:
  - name, state, repo/branch and actions (pull + redeploy with the `signal` variant when something is pending);
  - problem banner;
  - commit strip;
  - `SectionHeader` "01 Services" with the services table using `ImageRef` and update state;
  - "02 Call from CI" with the action selector, `CodeBlock` and `DeployCurlHint`.
- [x] 5.3 Add the "pick a stack" placeholder for `/stacks`, the not-found state for an unknown name (link to `/stacks`), the mobile "← Stacks" back link, and loading skeletons for both panes.
- [x] 5.4 Keep the bulk bar working with the new list: hidden-by-filter count, `InlineConfirm`, concurrency, summary toast, and trimming the selection to the failed stacks.
- [x] 5.5 Remove `stack-row.tsx` and the now-unused stacks keys (`expand`, `collapse`, …). Add the new copy (`stacks.detail.*`, `stacks.pickOne`, `stacks.notFound`, `stacks.back`, section titles) to `locales/es.ts` and `en.ts`.

## 6. Overview page

- [x] 6.1 Create `features/overview/` with `OverviewPage` (island via `withIsland`) and `index.ts`. It reads `useStacks()`, groups with `urgency()` and runs actions with `useDeployRunner()`.
- [x] 6.2 Build the header with `PageHero`, `RefreshButton` and `StatStrip`: attention (signal when > 0), updates, running, total.
- [x] 6.3 Build the "01 Needs attention" section:
  - one sentence per `problemKind`;
  - a redeploy button only for `danger` / `unknown`;
  - a details link to `/stacks/<name>`;
  - the "nothing needs attention" line when empty.
- [x] 6.4 Build the "02 Something new to deploy" section:
  - a table of the changed services (`ImageRef`) and deployed → latest commit;
  - per-row actions;
  - the header action "pull + redeploy on all N" with `InlineConfirm` and `runBulk`;
  - the "everything is up to date" line when empty.
- [x] 6.5 Build the "03 Running" and "04 Stopped" compact sections (dot, linked name, service count, deploying label), hidden when empty.
- [x] 6.6 Add the empty, error (`QueryErrorCard` with a `/credentials` link) and loading states.
- [x] 6.7 Add all overview copy (`overview.*`, the problem reasons) to `locales/es.ts` and `en.ts`.

## 7. Docs and conventions

- [x] 7.1 Update `AGENTS.md` (the "Reuse first" list gains `InlineConfirm`, `SectionHeader`, `StatStrip` and `useDeployRunner`; the project map mentions the overview), and keep `openspec/config.yaml` consistent with it.
- [x] 7.2 Update the site's stacks screen alt texts in `apps/site/src/i18n/ui.ts` (English and Spanish together) to describe the new pages, and leave a note for the user to retake `img/stacks.png` and `img/stacks-light.png` (plus an overview screenshot if wanted) from the running app.

## 8. Validation

- [x] 8.1 Run `bun run check-types`, `bunx biome check .` and `bun run tailwind:check`, and fix what they report.
- [x] 8.2 Run `bun run test` to confirm the API suites still pass (no API changes expected), and `openspec validate --all --strict`.
- [x] 8.3 Ask the user to review `/`, `/stacks`, `/stacks/<name>` and one non-redesigned page (for example `/history`) in light and dark, desktop and mobile, against the design artboards.
