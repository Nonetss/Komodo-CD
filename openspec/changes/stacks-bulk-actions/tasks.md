## 1. Concurrency helper

- [x] 1.1 Add `runPool(items, limit, task)` in `apps/frontend/src/features/stacks/model/run-pool.ts`: runs `task` with at most `limit` in flight and resolves with one `{ item, ok, value | error }` per item in input order, never rejecting
- [x] 1.2 Export a `BULK_CONCURRENCY = 3` constant next to it

## 2. Selection

- [x] 2.1 In `stacks-page.tsx`, add `selected: Set<string>` state and a derived selection intersected with the current `stacks` so vanished stacks drop out after a refresh
- [x] 2.2 Add `toggleSelected(name)` and `toggleAllShown()` (selects every stack in `filtered` unless all are selected, then deselects them; leaves stacks outside `filtered` untouched)
- [x] 2.3 In `stack-row.tsx`, add `selected` and `onSelect` props and a native checkbox (`accent-primary`, `aria-label` with the stack name) placed before the toggle button so clicking it never expands the row
- [x] 2.4 Above the `SoftCardList`, add the "select all" checkbox with its `indeterminate` state set through a ref when only some shown stacks are selected

## 3. Bulk action bar

- [x] 3.1 Create `apps/frontend/src/features/stacks/components/stacks-bulk-bar.tsx`: selected count, hidden-by-filters count when > 0, one button per action reusing `DEPLOY_ACTIONS`, `ACTION_ICON` and `ACTION_I18N`, and a clear-selection button; sticky at the bottom of the viewport
- [x] 3.2 Add the inline confirm state: choosing an action shows "<action> on N stacks?" with Confirm and Cancel; Cancel returns to the idle bar without side effects
- [x] 3.3 Disable the bar's actions while a bulk run is in progress or any selected stack has a pending action, and show a spinner on the running action

## 4. Bulk run

- [x] 4.1 Give `runAction` in `stacks-page.tsx` a `silent` option that updates `pending` and returns success/failure without toasting
- [x] 4.2 Add `runBulk(action)`: runs `runAction(name, action, { silent: true })` over the selection through `runPool` with `BULK_CONCURRENCY`, then shows one summary toast (success with the count, or error naming the failed stacks), removes succeeded stacks from `selected` and keeps the failed ones
- [x] 4.3 Mount `StacksBulkBar` in the page when the selection is not empty and wire `runBulk` and clear

## 5. i18n

- [x] 5.1 Add the new copy to the `stacks` section of both `apps/frontend/src/locales/es.ts` and `en.ts`: select stack, select all shown, selected count (plural), hidden count (plural), clear selection, confirm question (action + count, plural), confirm, cancel, bulk success (action + count) and bulk partial failure (failed count + names)

## 6. Validation

- [x] 6.1 Run `bun run check-types`, `bunx biome check .` and `bun run tailwind:check`
- [x] 6.2 Run `bun run test` to confirm the backend suites are unaffected
- [ ] 6.3 Ask the user to check the Stacks page in the browser (select, select all with filters, confirm/cancel, partial failure) and share a screenshot if anything looks off
