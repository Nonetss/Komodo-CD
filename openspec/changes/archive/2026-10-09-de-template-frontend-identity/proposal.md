## Why

The editorial identity introduced by `redesign-overview-and-stacks` reads as template-made: the same few devices are applied everywhere regardless of meaning — small tracked uppercase mono for almost every label, wide and heavy type on every title, numbered section headers with an orange number, a pure white ground over near-achromatic greys. Together they are the most common look of generated "editorial" interfaces, and none of them says anything about the product. Two cheap, token-level fixes remove most of that feel without touching layout or behaviour: reserve the loud devices for where they carry meaning, and give the neutrals a temperature.

## What Changes

- **Typography devices become scarce.**
  - Mono uppercase is kept for facts and chrome: counters, status words, navigation, filter options. Descriptive names (form labels, metadata field names, headings of explanatory blocks) move to a new quiet `caption` role in Archivo, sentence case.
  - Only the page title keeps the expanded, heavy cut, eased from width 125 / weight 900 to width 112 / weight 800. Section titles and stat figures use Archivo at normal width.
- **Section numbers mean order.** The overview keeps its numbered sections because they are ranked by urgency. The stack detail's "Services" and "Call from CI" sections lose their numbers. The number is ink-muted instead of orange, so Signal is left for what needs action.
- **Warm neutrals.** Paper becomes a warm off-white instead of pure white, ink and the greys take a warm tint (hue ~75, slightly higher chroma), in both themes. Signal, state colours and the code slab keep their roles; their values are re-checked for 4.5:1 on the new ground.
- `DESIGN.md` and the visual-identity spec are updated with the new rules (the One Signal Rule absorbs section numbers; a Mono-for-Facts rule that names what is not a fact).
- No layout, routing, API, backend or database change. **No database migration is needed.**

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `visual-identity`: Typography (title cut, the new `caption` role, mono limited to facts and chrome), Light and dark palettes (warm paper and tinted neutrals) and Signal accent (section numbers no longer use it). The requirements live today in the delta of the unarchived `redesign-overview-and-stacks`; this change builds on them, so that change is synced or archived first.

## Impact

- **Frontend** (`apps/frontend/src`):
  - `styles/global.css` (neutral tokens, type scale), `components/shared/brand/typography.tsx` (`caption` role, `section` and `stat` width, `display` cut), `components/shared/layout/section-header.tsx` (number tone), `components/ui/form.tsx` (form labels).
  - Label call sites reviewed one by one: `metadata-cell.tsx`, `connection-guide.tsx`, `deploy-page.tsx`, `action-choice.tsx`, `created-key.tsx`, `stack-detail.tsx`, `updates-section.tsx`, `stack-list.tsx`.
  - `stack-detail.tsx` already has uncommitted edits in the working tree; this change is applied on top of them.
- **Docs**: `apps/frontend/DESIGN.md` (front matter tokens, typography, named rules). README and site screenshots become outdated; the user retakes them from the running app.
- **Backend, API, gateway, database, locales**: unchanged.
