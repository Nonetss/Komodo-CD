## Context

`apps/frontend/src` (~5.8k lines) is organized by feature (`features/<domain>/{components,hooks,model}` + `index.ts`) with shared primitives in `components/ui/` and patterns in `components/shared/`. A review found:

- **Coupling.** `stacks` imports `ACTION_*`, `buildDeployCurl`, `DeployCurlHint` and `useDeployTrigger` from `@/features/deploy`. `deploy` imports `useStacks` and `StackStateDot` from `@/features/stacks`. Through the barrels this is an import cycle (`stacks/index` → `stacks-page` → `stack-row` → `deploy/index` → `deploy-page` → `stacks/index`). `credentials`, `history` and `api-keys` also reach into other features, sometimes by deep path (`use-deploy.ts` → `@/features/history/hooks/use-history`).
- **Duplication.** Two-click delete with a 3 s timer (3 copies), `try { mutateAsync } catch { notifyError(…, getErrorMessage(…)) }` (~10), `{isPending ? <Loader2/> : <Icon/>}` (~12), the error `StateCard` with retry (5), the refresh button (2), and the bordered card with header and footer (2).
- **i18n gaps.** Page titles are hard-coded Spanish in `pages/*/index.astro` ("Credenciales" does not even match `nav.credentials`). Also hard-coded: the theme toggle label, the language switcher labels, `mi-stack`, `update`, and the `"API Key"` actor fallback. `en.ts` is not checked against `es.ts`, and `t()` keys are untyped.
- **History actor.** `history-page.tsx` decides "this came from an API key" by testing `userName.startsWith("API Key")`, a string written by `packages/auth/src/session.ts`.
- **Small inconsistencies.** There are two components named `FormField`. Deploy and API key forms validate by hand while the others use react-hook-form + zod. Every page repeats `getLang(Astro.cookies)`. The shell mounts six control islands (language, theme and log-out, twice each). Some hook comments are in English. `StateCard` has unused options. And `package.json` carries unused dependencies plus Prettier, although the repo uses Biome.

`stacks-bulk-actions` is not applied yet. This change applies after it and also refactors its code (`stacks-bulk-bar.tsx`, `model/run-pool.ts`, the selection and `runAction({ silent })` in `stacks-page.tsx`).

## Goals / Non-Goals

**Goals:**

- No feature imports another feature; no import cycles.
- One implementation of each repeated UI pattern, used everywhere.
- All UI copy in the dictionaries, with missing or unknown keys caught by `check-types`.
- The History page reads the actor kind from the API instead of parsing a display string.
- Fewer islands in the shell, a lighter `package.json`, conventions written down in `AGENTS.md`.
- Identical user-visible behavior, except the now-localized titles and labels.

**Non-Goals:**

- Visual redesign, new pages or new features.
- Changing how the actor is stored (`action_history` columns), so no schema change and no migration.
- Adding a frontend test runner. The frontend keeps being validated by `check-types`, Biome and `tailwind:check`.
- Replacing the inline bulk confirmation of `stacks-bulk-actions` with `useConfirm`. It has different semantics: it shows Confirm/Cancel buttons and never expires.

## Decisions

### An `entities/` layer between features and shared code

New folders, each with an `index.ts`:

- `src/entities/stack/`: `hooks/use-stacks.ts` (`useStacks`, `stacksListKey`) and `components/stack-state.tsx` (`StackStateDot`, `StackStateTag`, `stateTone`).
- `src/entities/deploy-action/`: `model/deploy-actions.ts` (`DEPLOY_ACTIONS`, `ACTION_ICON`, `ACTION_I18N`, `API_KEY_PLACEHOLDER`, `buildDeployCurl`), `components/deploy-curl-hint.tsx` and `hooks/use-deploy-trigger.ts`.

`features/stacks/model/stack-groups.ts`, `run-pool.ts`, `image-ref.tsx` and the rows stay in `features/stacks`, because only that feature uses them. Import rules: features import entities, `lib`, `hooks`, `components` and `providers`. Entities never import features. Inside its own folder, a feature or entity keeps using `@/features/<self>/…` paths.

To avoid an entity importing `features/history`, `useDeployTrigger` invalidates with `orpc.v0.history.key()` and `orpc.v0.stacks.key()` from `@/lib/orpc`. Partial keys match every input variant. The exported `historyListKey` is removed if nothing else uses it.

- Why: two features need the same domain pieces, and an entities layer (the Feature-Sliced naming) lets them share without a cycle. It keeps the existing `components/hooks/model` subfolder rules.
- Alternative: moving these pieces into `lib/` and `components/shared/`. Rejected because it mixes domain code (stack states, deploy actions) into generic folders.
- Alternative: merging `stacks` and `deploy` into one feature. Rejected because they are separate pages and surfaces.

### Shared feedback and layout patterns

| Piece | Location | API |
|---|---|---|
| `useConfirm` | `src/hooks/use-confirm.ts` | `const { confirming, confirm } = useConfirm(onConfirmed, { timeout = 3000 })`. The first `confirm()` arms it; a second call within the timeout runs `onConfirmed`; it resets on timeout or after running. |
| `toastMutation` | `src/lib/toast.ts` | `toastMutation(run, { success, error, errorFallback? })`. `run` returns a promise. `success` is a title or `(result) => ({ title, description? })`; by default the description is `result.message` when present. `error` is a title; the description comes from `getErrorMessage(err, errorFallback)`. Resolves with the result, or with `undefined` on failure. Never throws. |
| `Button` `loading` + `icon` | `src/components/ui/button.tsx` | `icon?: LucideIcon` is rendered before the children. `loading` swaps it for a spinning `Loader2` and sets `disabled`. These props are ignored with `asChild` (Slot needs a single child). |
| `QueryErrorCard` | `src/components/shared/feedback/query-error-card.tsx` | `{ query, title, icon = ServerCrash, actions? }`. It renders `StateCard tone="destructive"` with `getErrorMessage(query.error, "")` and a Retry button that calls `query.refetch()`, followed by any extra `actions` (e.g. Stacks' "Configure"). |
| `RefreshButton` | `src/components/shared/form/refresh-button.tsx` | `{ query, label }`. An outline button with an icon that spins while `isFetching`, the "Refresh" text from `sm` up, and `aria-label={label}`. |
| `Panel` | `src/components/shared/layout/panel.tsx` | `{ title, description?, headingLevel = "h2", footer?, children }`. The `bg-surface rounded-xl border` card with a bordered header and an optional bordered footer. With `form`, the body and footer are wrapped in a `<form>`, so the submit button belongs to it. Used by `ConnectionForm` and `NtfyForm`. The Deploy form has no header, so it keeps its own card. |

- Why: one place to change behavior (e.g. the confirmation timeout) and much shorter page components. `toastMutation` returns instead of throwing, so callers can branch on the result without their own try/catch. Callers that need the error itself (Deploy shows it inline) keep their own catch.
- Alternative: a `<ConfirmButton>` component instead of a hook. Rejected because the three call sites render different buttons (an icon button that grows into a labelled one, and a small ghost button). A hook fits all of them.

### Typed dictionaries and keys

- `en.ts` ends with `satisfies typeof es`. A plain object-literal default export already widens to `string`, so no helper type is needed. A missing or extra key fails `check-types`.
- `src/i18next.d.ts` declares `CustomTypeOptions` with `defaultNS: "translation"` and `resources: { translation: typeof es }`, so `t()` and `<Trans i18nKey>` are typed.
- Dynamic keys must resolve to literal unions. `ACTION_I18N` becomes `as const satisfies Record<DeployAction, …>`, the `history.group.*` map is typed, and `stacks.states.${state}` must cover every `StackState` (any missing state is added to both dictionaries). A key that is unknowable at compile time keeps `defaultValue` and receives a narrow cast, commented in place.
- Section-level `cancel` keys (`credentials.cancel`, `apikeys.cancel`, …) are removed in favor of `common.cancel`.
- New copy: `common.toggleTheme`, `common.switchLanguage` (written in the target language, so each dictionary holds the other language's phrase, as today), `deploy.exampleStack`, `stacks.updateTag`, `history.apiKeyActor`.

### Language and titles from the request

The middleware sets `context.locals.lang = getLang(context.cookies)` first, before the public-path early return, so `/login` and the 404 page get it too. `App.Locals` in `env.d.ts` gains `lang: Lang`.

`DashboardLayout` takes `surface: SurfaceId` instead of `title` and builds `<title>` with `getI18n(lang).t(\`nav.${surface}\`)`. Login and 404 build theirs from `login.title` and `notFound.title`. Pages pass `Astro.locals.lang` to their island. `withIsland` defaults `lang` to `DEFAULT_LANG`.

### One `ShellControls` island per position

`features/app-shell/components/shell-controls.tsx` renders the language switcher, the theme toggle and log-out. A `layout: "sidebar" | "bar"` prop sets the spacing (in the sidebar, log-out is pushed right). It is wrapped with `withIsland` and mounted twice in `dashboard.astro` (sidebar and mobile header) instead of six islands. `ThemeToggle` now uses `t()`, so it must render inside an island. It already does on the login page, and it does in `ShellControls`. `LanguageSwitcher` and `LogOutButton` stop being standalone islands. `ThemeToggle` and `LanguageSwitcherButton` move to `src/components/shared/controls/`, because the login page (feature `auth`) also uses them and features may not import `app-shell`.

- Why: each `client:load` island is its own React root plus hydration. Six roots for nine buttons is wasteful, and the theme label needs i18n anyway.
- Alternative: rendering the controls once and moving them with CSS. Rejected because they sit in two different DOM containers (sidebar and sticky header).

### History actor derived on the server

`packages/auth/src/actor.ts` owns the convention:

- `apiKeyActorName(keyName)` returns `API Key: <name>` or `API Key`. `session.ts` uses it to write the name.
- `parseActor({ userId, userName, userEmail })` returns `{ via, actorName }`. The result is `apiKey` only when the email is empty and the name equals `API Key` or starts with `API Key: `. Otherwise it is `session`, with `actorName = userName ?? userEmail ?? userId`.

`historyHandler.list` spreads `parseActor(row)` into each entry, and `historyOutput.list` adds `via: z.enum(["session", "apiKey"])` and `actorName: z.string().nullable()`. `v0.history.list` stays a `protectedProcedure`: CI reads the history with its API key, and nothing about access changes. Existing fields are untouched, so current API consumers keep working. The frontend gets the fields through `HistoryItem` (inferred from the router) and drops `API_KEY_PREFIX` and its regex.

- Why: the convention lives next to the code that writes it, and the empty-email check stops a user who happens to be named "API Key…" from being misclassified. No migration is needed.
- Alternative: an `actor_kind` column. It is cleaner long-term, but it needs a schema change and a migration, which only the user may produce. It can come later without changing the API shape.

### Forms

The project's own `FormField` (`components/shared/form/field-label.tsx`) shares a name with shadcn's `FormField` in `components/ui/form.tsx`. Its only two callers are the Deploy and API key forms, which move to react-hook-form, so the file is removed rather than renamed. The Deploy form moves to react-hook-form + zod: `stack` is required and `action` is an enum, and `StackCombobox` is wired through `FormField` + `FormControl`, with `aria-invalid`/`aria-describedby` taken from the form context. The API key create form does the same (`name` required). The zod schemas are built in `useMemo` keyed on the language, as in `ConnectionForm`.

### Dependencies

From `apps/frontend/package.json`:

- Remove `@astrojs/mdx`, `canvas-confetti`, `@types/canvas-confetti`, `openid-client`, `prettier`, `prettier-plugin-astro` and `prettier-plugin-tailwindcss`.
- Move `@types/node`, `@types/react` and `@types/react-dom` to `devDependencies`.

`@tailwindcss/language-server` stays: `tailwind:check` (tailwint) needs it. `bun install` refreshes `bun.lock`. No workspace is added, so the Dockerfile manifest `COPY` lines don't change. With `ssr.noExternal`, the production bundle does not depend on where a package sits.

### Smaller cleanups

- Remove `StateCard`'s `spinner` prop and `celebrate` tone (no callers).
- Rewrite the comments in `use-hydrated.ts` and `use-hydrated-query.ts` in Spanish, describing `client:load` islands.
- The "API Key" fallback and `mi-stack` go through i18n (see above).

### Applying on top of `stacks-bulk-actions`

- `stacks-bulk-bar.tsx` imports `DEPLOY_ACTIONS`, `ACTION_ICON` and `ACTION_I18N` from `@/entities/deploy-action` and uses `Button` `icon`/`loading`.
- In `stacks-page.tsx`, the bulk and single runs keep `pending` and `runPool`. The single non-silent path uses `toastMutation`.
- `run-pool.ts` is untouched.

If `stacks-bulk-actions` has not been applied when this change starts, stop and ask.

### Documentation

`AGENTS.md` (Project map / Reuse first) and `openspec/config.yaml` (frontend convention) describe `src/entities/`, the no-cross-feature-import rule and the shared feedback helpers. Both are updated in this change.

## Risks / Trade-offs

- [The typed `t()` surfaces many errors at once, mostly dynamic keys] → Fix them by typing the key maps. A narrow cast is acceptable only where the key truly comes from the API (`stacks.states.*` with `defaultValue`), with a comment.
- [Large diff touching most frontend files, with no frontend tests] → The work is split into small task groups, each ending with `check-types` + Biome. At the end, the user checks every page in the browser (screenshot if anything is off). Behavior is meant to stay identical.
- [Biome cannot easily enforce "no cross-feature imports" while own-feature imports also use `@/features/…`] → A validation task greps for violations. A lint rule can be added later if intra-feature imports move to relative paths.
- [`parseActor` still relies on a naming convention for existing rows] → The convention is now defined in one place, guarded by the empty email, and covered by tests. An `actor_kind` column remains possible later.
- [Removing a dependency that something imports dynamically] → A repo-wide grep before removal, then `check-types` and a frontend build (`bunx turbo build -F frontend`).

## Migration Plan

Frontend and API ship together in the next image, with no database migration. The API change is additive. Rollback is reverting the commit.

## Open Questions

None blocking. The `actor_kind` column and a lint rule for imports are left as possible follow-ups.
