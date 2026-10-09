## Context

The Stacks page (`apps/frontend/src/features/stacks/components/stacks-page.tsx`) lists the Komodo stacks and runs one action per click through `useDeployTrigger` (`@/features/deploy`), which calls `v0.deploy.trigger` and invalidates the stacks and history queries. Per-stack progress lives in a `pending: Record<string, DeployAction | null>` map that `StackRow` reads to show a spinner and disable its buttons. Each successful or failed call produces a toast.

`v0.deploy.trigger` already records one `action_history` row per call and alerts through ntfy on each failure. The frontend has no checkbox or dialog primitive (`components/ui/` holds only button, form, input, label, skeleton) and no Radix checkbox dependency.

## Goals / Non-Goals

**Goals:**

- Select several stacks (one by one or "all shown") and run one action on all of them.
- Keep history and alerts per stack, identical to running each action by hand.
- One summary toast per bulk run; failures easy to retry.

**Non-Goals:**

- A batch endpoint for CI (`POST /api/v0/deploy` with several stacks). CI keeps calling one stack per request.
- Different actions per stack in one run, scheduling, or cancelling a run in progress.
- Selection on the Deploy page.

## Decisions

### Fan out from the frontend over the existing procedure

The bulk run calls `v0.deploy.trigger` once per stack instead of adding a `v0.deploy.triggerMany` procedure. No procedure is added or changed, so no access tier changes: the calls keep `protectedProcedure`.

- Why: history rows, ntfy alerts, `toKomodoError` mapping and per-stack error messages come for free and stay identical; per-row spinners fall out of the existing `pending` map; no API contract or OpenAPI change.
- Alternative: a batch procedure returning per-stack results. It would need its own partial-failure contract and tests, and a long request could hit proxy timeouts on many `pull-redeploy`s. Worth it only if CI needs batches, which nobody asked for.

### Concurrency limit of three

A small pure helper `runPool(items, limit, task)` in `features/stacks/model/` runs the calls with at most three in flight and resolves with every result (`Promise.allSettled`-style, never rejects).

- Why: fully parallel calls on many stacks would make the Komodo host pull and restart everything at once; fully sequential runs are slow for `pull`. Three is a middle ground and a single constant.
- Alternative: an external library (`p-limit`). Not worth a dependency for ~15 lines.

### Selection state in the page, keyed by name

`StacksPage` owns `selected: Set<string>` next to `expanded`, keyed by stack name like `pending` and `expanded`. A derived set intersects it with the current `stacks` so vanished stacks drop out after a refresh. "Select all" acts on `filtered` only; the bar reports how many selected stacks the filters hide so nothing runs unseen.

### Native checkbox, no new primitive

Rows and the header use `<input type="checkbox">` styled with Tailwind (`accent-primary`, `size-4`), with `aria-label` and `indeterminate` set through a ref for the header. The row checkbox sits outside the row's toggle button so clicking it never expands the row.

- Alternative: add shadcn's `Checkbox` (needs `@radix-ui/react-checkbox`). A dependency for a single control is not justified now; it can replace the native input later without spec changes.

### Inline confirmation in the bulk bar

A new `StacksBulkBar` component (`features/stacks/components/stacks-bulk-bar.tsx`) shows the count, the three action buttons (reusing `DEPLOY_ACTIONS`, `ACTION_ICON`, `ACTION_I18N`) and a clear button. Choosing an action switches the bar to a confirm state ("Redeploy on 5 stacks?" + Confirm / Cancel) instead of opening a dialog, since there is no dialog primitive and the bar is already in view. The bar is sticky at the bottom of the viewport so it stays reachable in long lists.

### Toasts and selection after a run

The single-stack `runAction` gains a `silent` option so bulk calls update `pending` without toasting. After `runPool` settles, one `notifySuccess` or `notifyError` (listing failed stack names) is shown, succeeded stacks are removed from `selected` and failed ones stay. `useDeployTrigger` already invalidates stacks and history on every settle.

## Risks / Trade-offs

- [Closing the tab mid-run stops the remaining calls] → Calls already in flight finish on the backend; the summary toast is lost. Acceptable for a dashboard action; history shows what ran.
- [Many invalidations, one per settled call] → TanStack Query dedupes concurrent refetches; at most a few extra `ListStacks` calls.
- [Running on stacks hidden by filters] → The bar shows the hidden count and the confirmation shows the total, so the user sees what will run.
- [Native checkbox looks slightly different from shadcn] → Styled with theme tokens; can be swapped for a primitive later.

## Migration Plan

Frontend-only; ships with the next image. No database migration, no API change, no rollback steps beyond reverting the commit.
