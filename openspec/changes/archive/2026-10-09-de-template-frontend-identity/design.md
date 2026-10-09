## Context

`redesign-overview-and-stacks` (not archived yet) set the identity: Archivo + JetBrains Mono, paper and ink, one orange Signal, rules instead of cards. The system is consistent, but its devices are applied by default instead of by meaning, which is what makes it read as generated. Today:

- `Text` roles `label` and `status` are mono, 11px, `tracking-widest`, uppercase, and 19 call sites use `variant="label"`, plus form labels (`components/ui/form.tsx`), nav and segmented options.
- `display`, `section` and `stat` all use expanded widths (125 / 112 / 112) at weights 800–900.
- `SectionHeader` numbers sections in Signal everywhere it is used: the overview (ranked by urgency) and the stack detail ("Services", "Call from CI", which have no real order).
- Neutrals are hue 100 with chroma ≤ 0.008 over a pure white ground (`oklch(1 0 0)`).

The identity lives in `global.css` tokens and in the shared components, so the fix is also made there and in a review of the label call sites.

## Goals / Non-Goals

**Goals:**

- Reserve mono uppercase, expanded width and the orange number for the places where they mean something.
- Give the neutrals a temperature in both themes without a second accent or a new palette structure.
- Keep every contrast target (4.5:1 for secondary text and for Signal used as text).

**Non-Goals:**

- No layout, routing, component API or behaviour change, and no new feature (deploy timeline, wordmark, microcopy are separate changes).
- No change to the One Signal Rule, rules-not-cards, square corners or the dot-and-word state language.
- No change to locales: the copy stays as it is.

## Decisions

**1. A `caption` role instead of restyling `label`.** `label` stays mono uppercase and is for facts and chrome: counters in `StatStrip`, status words (`status` role), navigation, `Segmented` options and the `aside` of `SectionHeader`. A new `caption` role (Archivo 500, 0.75rem, sentence case, `text-muted-foreground`, no tracking) takes descriptive names: form labels, `MetadataCell` field names, headings of explanatory blocks (`connection-guide`, `deploy-ci`), the `ActionChoice` legend, `created-key` and the per-service captions in the stack detail and updates section. Alternative: soften `label` itself (drop caps, keep mono). Rejected, because every call site would change at once with no way to tell a fact from a name, and the Role-Not-Size rule is meant to make that choice explicit.

**2. Only the page title is expanded.** `display` goes from `wdth` 125 / weight 900 to `wdth` 112 / weight 800 (still the loudest thing on the page, no longer a poster). `section` and `stat` drop the `type-semi-expanded` utility and use normal width: `section` weight 700, `stat` weight 800 with tabular numerals. The `type-semi-expanded` utility is kept only if `display` uses it; `type-expanded` is removed if nothing else uses it. Alternative: keep the wide cut and only reduce weight. Rejected, since the width, not the weight, is the recognisable tell, and `stat` figures were the widest text on the overview.

**3. Numbered sections only where the order is ranked.** `SectionHeader` keeps its `number` prop. The overview keeps passing it (needs attention → updates → running → stopped is a real ranking). `stack-detail.tsx` stops passing it. The number renders in the muted tone, not Signal, so Signal is left for problems and actions; the One Signal Rule no longer lists section numbers. Alternative: remove numbering everywhere. Rejected: the numbers do carry the urgency order on the overview and the spec `dashboard-overview` requires numbered sections.

**4. Warm tinted neutrals via the existing tokens.** Only the values in `:root` and `.dark` change, not the token names, so no component is touched for this. Starting points to tune against the contrast check:

| Token | Light | Dark |
| --- | --- | --- |
| `background` (= card, surface, popover) | `oklch(0.985 0.006 85)` | `oklch(0.17 0.006 70)` |
| `foreground` / `primary` / `rule` | `oklch(0.19 0.01 70)` | `oklch(0.95 0.008 85)` |
| `secondary` / `muted` / `accent` | `oklch(0.955 0.008 85)` | `oklch(0.235 0.007 70)` |
| `muted-foreground` | `oklch(0.46 0.012 75)` | `oklch(0.72 0.012 80)` |
| `border` | `oklch(0.91 0.01 85)` | `oklch(0.3 0.007 70)` |
| `input` | `oklch(0.78 0.012 80)` | `oklch(0.42 0.008 70)` |

`popover` keeps pointing at `background` in light (paper is one colour) and one step up in dark. Signal, success, warning, info and the code slab keep their values unless the contrast check fails on the warmer ground; then only their lightness moves. Alternative: tint only the greys and keep pure white paper. Rejected, since the pure white ground is half of the cold look.

**5. Verification without running the app.** A small script in the scratchpad computes OKLCH contrast for each text token pair (`muted-foreground`, `signal`, `success`, `warning`, `info`, `foreground`) on `background` and `muted` in both themes. The look itself is reviewed by the user from the running app (the repo rules forbid probing it).

## Risks / Trade-offs

- [Warm paper makes the always-dark code slab and the syntax tones look different against the page] → The slab keeps its values; check the tab bar of `CodeBlock` over the warm ground by eye.
- [Moving labels to `caption` makes some dense rows (stack list, services table) lose their column-header feel] → Table headers and filter options stay `label`; only descriptive names move, decided call site by call site.
- [`display` at 112 / 800 may wrap differently on narrow screens] → The title already uses `wrap-anywhere` and `text-balance`; check `PageHero` at 360px in both languages.
- [The visual-identity requirements are modified while still living in an unarchived change] → The delta is written against that text, and `redesign-overview-and-stacks` is synced or archived before this one is.
- [Subjective result] → The change is small and token-level, so it can be tuned or reverted from `global.css` and `typography.tsx` without touching features.

## Migration Plan

No data or configuration migration, **no database migration**. Ship as a normal frontend change. Rollback is a revert of the token and role edits. The user retakes the README and site screenshots afterwards.

## Open Questions

- Does Signal at `oklch(0.553 0.195 38.4)` still reach 4.5:1 as text on the warm paper? The check in task 1.2 decides whether its lightness drops slightly.
