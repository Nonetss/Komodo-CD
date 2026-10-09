## Why

On the Stacks page every action (`pull`, `redeploy`, `pull-redeploy`) is launched one stack at a time. Rolling out a new image to several stacks, or redeploying everything after a host change, means clicking the same button on each row and watching a toast per stack. Selecting several stacks and running one action on all of them removes that repetition.

## What Changes

- Each stack row gets a selection checkbox; the list gets a "select all visible" checkbox (with an indeterminate state when only some visible stacks are selected).
- When at least one stack is selected, a bulk action bar appears with the selected count, the three actions and a button to clear the selection.
- Running a bulk action asks for an inline confirmation (action + number of stacks), then calls the existing `v0.deploy.trigger` once per selected stack with a small concurrency limit. Each row shows its own spinner while its call runs.
- The outcome is reported with one summary toast (all succeeded, or how many failed and which ones) instead of a toast per stack. Stacks that succeeded leave the selection; failed ones stay selected so the user can retry.
- No backend change: every stack still produces its own history row and, on failure, its own ntfy alert, exactly as a single action does today.
- No database migration is needed.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `stacks-overview`: the Stacks page gains multi-selection of stacks and a bulk action bar that runs one action on every selected stack.

## Impact

- Frontend only: `apps/frontend/src/features/stacks/` (`stacks-page.tsx`, `stack-row.tsx`, a new bulk bar component and a concurrency helper in `model/`), and the `stacks` section of `apps/frontend/src/locales/es.ts` and `en.ts`.
- Reuses `useDeployTrigger`, `DEPLOY_ACTIONS`, `ACTION_ICON` and `ACTION_I18N` from `@/features/deploy`. No new dependency (native checkbox, no new shadcn primitive).
- API, history, ntfy, CI and the `POST /api/v0/deploy` contract are unchanged.
