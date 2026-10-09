## 0. Preconditions

- [x] 0.1 Confirm `stacks-bulk-actions` is applied (its `stacks-bulk-bar.tsx` and `model/run-pool.ts` exist under `apps/frontend/src/features/stacks/`); if not, stop and ask the user

## 1. History actor in the API

- [x] 1.1 Add `packages/auth/src/actor.ts` with `apiKeyActorName(keyName)` and `parseActor({ userId, userName, userEmail })` returning `{ via: "session" | "apiKey", actorName: string | null }` (API key only when the email is empty and the name is `API Key` or starts with `API Key: `)
- [x] 1.2 Use `apiKeyActorName` in `packages/auth/src/session.ts` instead of the inline template
- [x] 1.3 Add `via: z.enum(["session", "apiKey"])` and `actorName: z.string().nullable()` to `historyOutput.list` (`packages/api/src/v0/history/output.ts`) and spread `parseActor(row)` into each entry in `historyHandler.list`; the router stays `protectedProcedure`
- [x] 1.4 Write `packages/api/tests/history.test.ts`: named key, unnamed key, session user with name, session user without name (email fallback), a user named like `API Keyes` with an email stays `session`, and the 100-row limit and ordering; run `bun run test`

## 2. Entities layer

- [x] 2.1 Create `apps/frontend/src/entities/stack/` with `hooks/use-stacks.ts` (`useStacks`, `stacksListKey`), `components/stack-state.tsx` (`StackStateDot`, `StackStateTag`, `stateTone`) and `index.ts`, moved from `features/stacks`
- [x] 2.2 Create `apps/frontend/src/entities/deploy-action/` with `model/deploy-actions.ts`, `components/deploy-curl-hint.tsx`, `hooks/use-deploy-trigger.ts` (invalidating `orpc.v0.history.key()` and `orpc.v0.stacks.key()`) and `index.ts`, moved from `features/deploy`
- [x] 2.3 Update every importer (`stacks`, `deploy`, `credentials`, `history`, `api-keys`, including `stacks-bulk-bar.tsx`) to import these from `@/entities/…`; trim the `features/stacks`, `features/deploy` and `features/history` barrels to what pages still need (drop `historyListKey` if unused)
- [x] 2.4 Verify there are no cross-feature imports: `grep -rn "@/features/" apps/frontend/src/features apps/frontend/src/entities` only shows imports of the importing feature's own folder, and `apps/frontend/src/entities` never imports `@/features/`

## 3. Shared patterns

- [x] 3.1 Add the `icon` and `loading` props to `apps/frontend/src/components/ui/button.tsx` (spinner swaps the icon and disables the button; ignored with `asChild`)
- [x] 3.2 Add `useConfirm` in `apps/frontend/src/hooks/use-confirm.ts` (3 s default timeout) and replace the confirm timers in `connection-summary.tsx`, `ntfy-section.tsx` and `api-key-row.tsx`
- [x] 3.3 Add `toastMutation` to `apps/frontend/src/lib/toast.ts` and use it wherever a mutation only reports its outcome (connection save/delete, ntfy save/test/toggle/delete, API key delete, single stack action); keep the explicit catch where the error is also shown inline (Deploy)
- [x] 3.4 Add `QueryErrorCard` (`components/shared/feedback/query-error-card.tsx`) and use it in the stacks, history, credentials, ntfy and API key pages (Stacks passes its "Configure" link as an extra action)
- [x] 3.5 Add `RefreshButton` (`components/shared/form/refresh-button.tsx`) and use it in the stacks and history page heroes
- [x] 3.6 Add `Panel` (`components/shared/layout/panel.tsx`) and use it in `ConnectionForm` and `NtfyForm` (the Deploy form has no header and keeps its own card)
- [x] 3.7 Replace the remaining `{isPending ? <Loader2 …/> : <Icon/>}` patterns with `Button` `icon`/`loading`, including the bulk bar from `stacks-bulk-actions`

## 4. Forms

- [x] 4.1 Remove `components/shared/form/field-label.tsx` (its `FormField` clashed with shadcn's): once 4.2 and 4.3 move its only two callers to react-hook-form, nothing uses it
- [x] 4.2 Move the Deploy form to react-hook-form + zod (`stack` required, `action` enum), wiring `StackCombobox` through `FormField` + `FormControl` and keeping the inline result and toasts
- [x] 4.3 Move the API key create form to react-hook-form + zod (`name` required), keeping focus on open, Escape to cancel and the one-time key display

## 5. i18n

- [x] 5.1 Make `apps/frontend/src/locales/en.ts` end with `satisfies typeof es` and fix any key mismatch it reveals
- [x] 5.2 Add `apps/frontend/src/i18next.d.ts` with `CustomTypeOptions` (`defaultNS: "translation"`, `resources: { translation: typeof es }`) and fix the resulting type errors: `ACTION_I18N` `as const`, typed group/state maps, missing `stacks.states.*` added, a commented cast only where the key comes from the API
- [x] 5.3 Add `common.toggleTheme`, `common.switchLanguage`, `deploy.exampleStack`, `stacks.updateTag` and `history.apiKeyActor` to both `es.ts` and `en.ts`; use them in `theme-toggle.tsx`, `language-switcher.tsx`, `deploy-page.tsx`, `created-key.tsx`, `stack-row.tsx` and `history-page.tsx`
- [x] 5.4 Replace the section-level `cancel` keys with `common.cancel` in both dictionaries and their callers
- [x] 5.5 In `history-page.tsx`, build the actor from `via` and `actorName` (key icon + key name or `history.apiKeyActor`; user icon + `actorName`) and drop `API_KEY_PREFIX` and its regex

## 6. Language, titles and shell

- [x] 6.1 Add `lang: Lang` to `App.Locals` in `apps/frontend/src/env.d.ts` and set `context.locals.lang` in `middleware.ts` before the public-path early return
- [x] 6.2 Change `DashboardLayout` to take `surface: SurfaceId` and build `<title>` from `nav.<surface>` in the request language; update the five dashboard pages to pass `surface` and `Astro.locals.lang`
- [x] 6.3 Build the login and 404 titles from `login.title` and `notFound.title`; make `main.astro` and the pages read `Astro.locals.lang` instead of calling `getLang`
- [x] 6.4 Default `withIsland`'s `lang` to `DEFAULT_LANG` in `providers/island.tsx`
- [x] 6.5 Add `features/app-shell/components/shell-controls.tsx` (language, theme, log-out; `layout: "sidebar" | "bar"`), wrapped with `withIsland`; mount it once in the sidebar and once in the mobile header of `dashboard.astro`, and update the `app-shell` barrel

## 7. Cleanups and dependencies

- [x] 7.1 Remove `StateCard`'s `spinner` prop and `celebrate` tone
- [x] 7.2 Rewrite the comments of `hooks/use-hydrated.ts` and `hooks/use-hydrated-query.ts` in Spanish, describing `client:load` islands
- [x] 7.3 Grep the repo for `@astrojs/mdx`, `canvas-confetti`, `openid-client` and `prettier`; then remove them (and `@types/canvas-confetti`, `prettier-plugin-astro`, `prettier-plugin-tailwindcss`) from `apps/frontend/package.json`, move `@types/node`, `@types/react` and `@types/react-dom` to `devDependencies`, and run `bun install` to refresh `bun.lock`
- [x] 7.4 Run a frontend build (`bunx turbo build -F frontend`) to confirm nothing depended on the removed packages

## 8. Docs and specs

- [x] 8.1 Update `AGENTS.md` (Project map and Reuse first) and the frontend convention in `openspec/config.yaml` with `src/entities/`, the no-cross-feature-import rule and the shared feedback helpers (`useConfirm`, `toastMutation`, `QueryErrorCard`, `Button` `loading`)
- [x] 8.2 Run `openspec validate --all --strict`

## 9. Validation

- [x] 9.1 Run `bun run check-types`, `bunx biome check .` and `bun run tailwind:check`
- [x] 9.2 Run `bun run test`
- [x] 9.3 Ask the user to check every page in the browser in both languages and both themes (titles, delete confirmations, error and empty states, Deploy and API key forms, History actors, shell controls on desktop and mobile, bulk actions) and to share a screenshot if anything looks off
