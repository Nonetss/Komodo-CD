## Context

Today `/` redirects to `/stacks`. That page is a single React island (`features/stacks/components/stacks-page.tsx`) that renders one expandable row per stack, with per-row action buttons, selection and a bulk bar. The action logic all lives inside the page component:

- the `pending` map;
- the merge with `useDeployEvents()` for deploys started elsewhere;
- `runAction` with `toastMutation`;
- `runBulk` with `runPool` and a summary toast.

The grouping rules (`inGroup`, `hasProblem`, `hasUpdate`) live in `features/stacks/model/stack-groups.ts`.

The look comes from:

- the tokens in `styles/global.css` (cool slate, Komodo blue, dark by default);
- two fontsource fonts declared in `astro.config.mjs` (Space Grotesk, Space Mono);
- the shared components in `components/ui/` and `components/shared/`.

The new direction was chosen from design explorations: a *triage* overview at `/` (direction "C") and a master–detail `/stacks` in the same editorial style (direction "E").

No backend work is needed: `v0.stacks.list`, `v0.deploy.trigger` and the deploy events subscription already provide everything the two pages show.

## Goals / Non-Goals

**Goals:**

- An overview at `/` that groups stacks by urgency and lets the user act on them.
- `/stacks/<name>` as a master–detail page where the list, its filters and the selection survive moving between stacks.
- One editorial visual identity applied through tokens and shared components, so every page changes without being redesigned one by one.
- Light theme by default, with an editorial dark theme.
- The action and bulk logic shared by both pages, not duplicated.

**Non-Goals:**

- No new or changed procedures, API routes, gateway routes or database schema. No migration.
- No redesign of the layouts of the deploy, history, connection, API keys and login pages. They only inherit the new tokens and components.
- No change to the deploy events protocol or to how CI calls the API.
- New screenshots for the README and the site are not part of the agent's work: the user takes them from the running app.

## Decisions

### No API changes

Both pages read `v0.stacks.list` (`protectedProcedure`) and act through `v0.deploy.trigger` (`protectedProcedure`). The overview also uses the existing deploy events subscription. No procedure is added or changed, so no access tier changes.

### Routes and a persisted Stacks island

The pages are:

- `pages/index.astro` mounts the overview island (surface `overview`).
- `pages/stacks/index.astro` and a new `pages/stacks/[name].astro` both mount the same island:

  ```astro
  <StacksPage client:load transition:persist="stacks-page" stack={name ?? null} lang={…} />
  ```

List items are plain `<a href="/stacks/<encoded name>">` links. The client router prefetches them on hover and navigates. Because the island is persisted under the same id on both routes:

- Astro moves the live island into the new page instead of remounting it, so search, group, selection and an in-flight bulk run survive.
- Astro re-renders it with the new `stack` prop. This is the default for persisted islands; `transition:persist-props` is deliberately not used.
- Back and forward work through the client router's normal history.

Alternatives considered:

- **One page with `history.pushState`.** It fights the client router's own history handling, and the server would not know which stack the URL names.
- **`/stacks?stack=<name>`.** Rejected by the user in favour of a path per stack.
- **Lifting the selection into `sessionStorage`.** It works across any navigation but adds serialization and stale-state edge cases for a problem `transition:persist` already solves.

The selection still resets when leaving the Stacks pages (for example to `/history`), as it does today.

The `[name]` page does not check whether the stack exists, because the stacks data is fetched client-side through `useHydratedQuery`. The island shows the not-found state when the name matches no stack.

### Responsive master–detail without client checks

The island renders both panes and sets a `data-open` attribute when `stack` is not null. Below `lg`, CSS hides:

- the detail pane when nothing is open;
- the list pane when a stack is open.

The detail pane then shows a "← Stacks" link to `/stacks`. This is SSR-safe: there is no `matchMedia` and no hydration mismatch.

### Shared logic moves to entities

| Piece | From | To |
|---|---|---|
| `StackGroup`, `inGroup`, `hasProblem`, `hasUpdate` | `features/stacks/model/stack-groups.ts` | `entities/stack/model/stack-groups.ts` |
| New `problemKind(stack)`: `project-missing` \| `missing-files` \| `danger` \| `unknown` \| `null` | — | `entities/stack/model/stack-groups.ts` |
| New `urgency(stack)`: `attention` \| `updates` \| `running` \| `stopped`, the overview's single classification | — | `entities/stack/model/stack-groups.ts` |
| `ImageRef` | `features/stacks/components/image-ref.tsx` | `entities/stack/components/image-ref.tsx` |
| `runPool`, `BULK_CONCURRENCY` | `features/stacks/model/run-pool.ts` | `entities/deploy-action/model/run-pool.ts` |
| New hook `useDeployRunner()`, extracted from `stacks-page.tsx` | — | `entities/deploy-action/hooks/use-deploy-runner.ts` |

`useDeployRunner()` returns:

- `runningAction(name)`: the local pending action, or else the live one from `useDeployEvents()`;
- `run(name, action)`: one action with a toast;
- `runBulk(names, action)`: through `runPool`, with one summary toast. It resolves with the succeeded names so the Stacks page can trim its selection.

Both pages use this hook, so the toasts, invalidations and live-state rules stay identical.

The inline "Are you sure? Confirm / Cancel" swap of `StacksBulkBar` becomes a shared `InlineConfirm` in `components/shared/feedback/`. The bulk bar and the overview's "pull + redeploy on all N" both use it. It differs from `useConfirm`, which stays for two-click destructive buttons.

### Feature layout

`features/overview/`:

- `components/overview-page.tsx` (island);
- `overview-counters.tsx`;
- `attention-section.tsx`;
- `updates-section.tsx`;
- `compact-section.tsx` (running and stopped);
- `index.ts`.

`features/stacks/`:

- `stacks-page.tsx` (island: state, panes);
- `stack-list.tsx` and `stack-list-item.tsx`;
- `stack-detail.tsx`, `stack-detail-placeholder.tsx` and `stack-not-found.tsx`;
- `stacks-bulk-bar.tsx`, kept.

`stack-row.tsx` is removed: its contents split between `stack-list-item.tsx` and `stack-detail.tsx`.

Shared layout pieces:

- The numbered section header ("01 Servicios", "02 Llamar desde CI", the overview sections) is used by both features, so it becomes `SectionHeader` in `components/shared/layout/`.
- The counters strip also becomes shared (`StatStrip`) for the same reason. `HeroCount` is reworked into it.

### Visual identity through tokens first

**Tokens.** `styles/global.css` keeps the shadcn variable names (`--background`, `--foreground`, `--primary`, `--border`, `--muted-foreground`, …), so primitives keep working. It changes:

- the values of those variables;
- `--radius: 0`;
- two new tokens: `--signal` (the orange accent) and `--rule` (heavy ink rule colour);
- `--danger`, which aliases `--signal`.

Starting values:

| Token | Light | Dark |
|---|---|---|
| background | `#FFFFFF` | `#0F0F0F` |
| foreground / rule | `#0F0F0F` | `#F2F2EE` |
| muted-foreground | `#5E5E5A` | `#A3A39D` |
| border (hairline) | `#E4E4E0` | `#2A2A28` |
| signal / danger | `#C2410C` | `#FF8A4C` |
| success | `#178A4A` | `#5FD08A` |
| info | `#2563EB` | `#7AA7FF` |
| warning | `#A16207` | `#E8B04A` |

These are written as `oklch()` like today, and the contrast is checked at 4.5:1. `primary` is ink (paper in dark), so primary buttons are ink. The signal is applied explicitly through a `signal` variant or tone where the spec allows it.

**Fonts.** `astro.config.mjs` swaps the two fontsource entries for Archivo (variable, weights `100 900`, width axis) and JetBrains Mono. The CSS variables are renamed (`--font-archivo`, `--font-jetbrains-mono`), and `main.astro` preloads them. Display text uses Tailwind's `font-stretch-*` utilities. The `--text-display` step grows to fit the larger expanded titles.

**Components restyled**, in place, keeping their props:

- `Button`: square, 1.5px ink border on `outline`, ink `default`, new `signal` variant;
- `Input`: underline style;
- `Segmented`: uppercase mono labels with a signal underline for the active option;
- `StatusDot` and `StatusTag`: mono uppercase labels, hollow dot for neutral states;
- `PageHero`: mono kicker, expanded title, heavy rule;
- `CodeBlock`: ink block;
- `SoftCardList`: ruled list, no card background;
- `StateCard`, `QueryErrorCard`, `Panel`: ruled, square;
- the shell's `SidebarNav`, `BottomNav` and logo block.

Feature code is then audited for local colour or radius overrides (`bg-primary/…`, `rounded-…`, literals) and moved onto the components.

**Theme default.** The inline script in `layouts/main.astro` becomes `classList.toggle("dark", stored === "dark")`, and `<meta name="color-scheme">` becomes `light dark`. The toggle already stores both values explicitly, so it needs no change. Users who never touched the toggle will see light after the upgrade, which is the intended change. Users who chose light keep it, and users who chose dark keep dark (`theme=dark` is stored).

### Shell: a top bar instead of the sidebar

The user asked for the shell of the design artboards: a horizontal navbar, not the sidebar. The desktop sidebar and the mobile top bar merge into one sticky `<header>` in `layouts/dashboard.astro`, closed by the heavy rule:

- the `KOMODO/CD` wordmark on the left (the shared `Wordmark`, also on the login page), as in the artboards;
- `TopNav` (uppercase mono links, a signal underline sitting on the rule for the active one), shown from `lg`;
- on the right, only the single `ShellControls` island.

The bar spans the full width with the page gutters, as in the stacks artboard. Ordinary pages keep a centred `max-w-6xl` column. The Stacks pages pass `bleed` to the layout: they go full width under the bar, and their list column is sticky at viewport height with its own scroll, so the detail stays in view with hundreds of stacks. Below `lg` the header keeps only logo and controls, and the six-tab `BottomNav` stays. `ShellControls` loses its `layout` prop because there is only one position now. The `sidebar-chrome` / `mobile-header` transition names become one `top-bar` name, and `main` no longer has the `lg:pl-60` offset. `main` also loses its own `dashboard-page` name: the page fade goes on `<html>` (`layouts/main.astro`), because a named `main` morphs its size between the bleed and the centred pages and each change looked different. `PageHero` drops the surface icon above the title, which the artboards do not have.

### Navigation

`lib/app-surfaces.ts` gains `{ id: "overview", path: "/", icon: … }` first, and `SurfaceId` gains `"overview"`. `isActive` in `app-nav.tsx` stops treating `/` as a prefix (`href === "/" ? path === "/" : …`). `BottomNav` goes from five to six columns. The logo link in `layouts/dashboard.astro` and the 404 link point to `/`. `pages/index.astro` stops redirecting.

## Risks / Trade-offs

- **[Risk]** `transition:persist` may not carry React state or re-render with the new `stack` prop as expected in Astro 7.3 with React 19.
  - **Mitigation:** the first implementation task is a spike that persists a counter across `/stacks/a` → `/stacks/b`, checking that the state survives and the prop updates.
  - **Fallback:** a single route that handles `/stacks/*` with `history.pushState` and a `popstate` listener, keeping the same component tree.
- **[Risk]** The fontsource provider may not expose Archivo's width axis, so the expanded titles would fall back to normal width.
  - **Mitigation:** check the generated `@font-face` during the spike.
  - **Fallback:** `fontProviders.local()` pointing at the variable woff2 of `@fontsource-variable/archivo` (a new devDependency), which includes the `wdth` axis.
- **[Trade-off]** The list loses its per-row action buttons. A quick redeploy now takes one more click (open the stack) or goes through the overview, whose rows do have buttons. The user approved this layout. Bulk actions are unchanged.
- **[Risk]** Pages that are not redesigned may rely on old tints (`bg-primary/10`, rounded cards) and look off with square ink styling.
  - **Mitigation:** a dedicated task greps `src/features` for colour literals, `/<opacity>` primary tints and `rounded-` classes and moves them to shared components.
- **[Risk]** Six bottom-bar tabs are tight at 320 px.
  - **Mitigation:** mono uppercase labels at the 11 px floor, icons kept. The labels are checked in both languages ("Resumen" / "Overview" is the longest new one).
- **[Trade-off]** Changing the default theme flips existing users who never chose a theme to light. This is accepted because it is the purpose of the change.
- **[Risk]** The README and site screenshots become outdated until the user retakes them. The task list says so explicitly.

## Migration Plan

The change is frontend only and ships with the normal image build. There is no data migration and no configuration change. Rollback is reverting the change: old bookmarks of `/stacks` keep working in both versions, and `/stacks/<name>` URLs would 404 after a rollback. That is acceptable for a UI rollback.

## Open Questions

- Icon for the overview surface: `LayoutDashboard`, or `Radar` to match the "triage" idea. The default is `LayoutDashboard` unless the user prefers otherwise.
