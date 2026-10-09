## Why

The frontend's feature folders are sound, but they have grown coupled and repetitive: `stacks` and `deploy` import each other through their barrels (an import cycle), the same confirm-delete, toast-on-mutation, loading-button, error-card and refresh-button code is copy-pasted across five pages, some UI copy and page titles bypass i18n, and the History page guesses whether an actor was an API key by parsing a display string. Cleaning this up now, before more features land on the Stacks page, keeps every later change smaller.

## What Changes

- **Entities layer.** Add `apps/frontend/src/entities/` for domain pieces several features share: `entities/stack` (stacks query and key, state tone, `StackStateDot`/`StackStateTag`) and `entities/deploy-action` (actions, icons, i18n keys, `buildDeployCurl`, `DeployCurlHint`, `useDeployTrigger`). Features import from entities and shared code, never from another feature; the `stacks` ↔ `deploy` cycle disappears.
- **Shared patterns extracted.** A `useConfirm` hook for the two-click destructive buttons, a `toastMutation` helper for the try/notify/catch blocks, a `loading` prop on `Button`, `QueryErrorCard`, `RefreshButton` and a `Panel` (card with header and footer) in `components/shared/`. Every page uses them instead of local copies.
- **i18n.** Page `<title>`s come from `nav.<id>` through the dashboard layout instead of hard-coded Spanish strings. The theme toggle label, the language switcher labels, the `mi-stack` example name, the `update` tag and the API key actor fallback move to the dictionaries. `en.ts` is type-checked against `es.ts`, and `t()` keys are type-checked through react-i18next's `CustomTypeOptions`. Per-section `cancel` keys collapse into `common.cancel`.
- **History actor from the backend.** `v0.history.list` entries gain `via: "session" | "apiKey"` and `actorName`, derived on the server from the stored row with the same convention `resolveSession` uses to write it. The History page stops parsing `"API Key: …"`. Additive API change; existing fields are unchanged.
- **Consistency fixes.** The Deploy and API key forms use react-hook-form + zod like the other forms, which leaves the project's own `FormField` (`components/shared/form/field-label.tsx`, clashing with shadcn's) unused, so it is removed. The request language is resolved once in the middleware into `Astro.locals.lang`; `withIsland` defaults to `DEFAULT_LANG`. The shell renders one `ShellControls` island per position instead of three islands each. Hook comments follow the Spanish-comment convention and describe `client:load`. Unused `StateCard` options (`spinner`, `celebrate`) are removed.
- **Dependencies.** Remove unused frontend dependencies (`@astrojs/mdx`, `canvas-confetti`, `@types/canvas-confetti`, `openid-client`) and Prettier with its plugins (the repo uses Biome); move the remaining `@types/*` to `devDependencies`.
- **Sequencing.** This change is applied after `stacks-bulk-actions` and also refactors the code it adds (`stacks-bulk-bar.tsx`, `run-pool.ts`, the selection in `stacks-page.tsx`).
- No user-visible behavior is removed. No database migration is needed: `via` and `actorName` are computed from existing columns.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `frontend-architecture`: pages read the language from `Astro.locals`; an `entities/` layer joins the folder rules and features no longer import each other; shared feedback patterns (confirm, toast helper, error card) become the required way to give feedback.
- `internationalization`: the English dictionary is type-checked against the Spanish one and translation keys are type-checked at build time.
- `web-navigation`: page titles come from the surface registry's `nav.<id>` labels; the shell controls are one island per position.
- `deploy-history`: `v0.history.list` entries include `via` and `actorName`, and the History page uses them to show API key actors.

## Impact

- Frontend: most of `apps/frontend/src` (`features/*`, new `entities/`, `components/shared/`, `components/ui/button.tsx`, `layouts/`, `pages/`, `middleware.ts`, `env.d.ts`, `providers/island.tsx`, `locales/`), including the files added by `stacks-bulk-actions`.
- Backend: `packages/api/src/v0/history/` (`output.ts`, `handler.ts`) and a small actor helper in `packages/auth/src/` shared with `session.ts`; new tests in `packages/api/tests/history.test.ts`. Access tier unchanged (`protectedProcedure`).
- API: `GET /api/v0/history` and `v0.history.list` gain two fields (additive, non-breaking); the OpenAPI document updates automatically.
- Dependencies: `apps/frontend/package.json` and `bun.lock`.
- Docs: `AGENTS.md` and `openspec/config.yaml` describe the `entities/` layer and the no-cross-feature-import rule.
- Database: no schema change, no migration.
