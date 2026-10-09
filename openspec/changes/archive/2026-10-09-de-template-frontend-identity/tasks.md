## 1. Neutral tokens

- [x] 1.1 Replace the neutral values in `:root` and `.dark` of `apps/frontend/src/styles/global.css` with the warm, tinted ones from the design (background, foreground/primary, secondary/muted/accent, muted-foreground, border, input, dark popover); keep token names and make `card`, `surface` and light `popover` follow `background`
- [x] 1.2 Write a throwaway OKLCH contrast script in the scratchpad and check `muted-foreground`, `foreground`, `signal`, `success`, `warning` and `info` on `background` and `muted` in both themes (4.5:1); adjust only lightness where a pair fails
- [x] 1.3 Check that the code slab and its syntax tones still read over the warm ground (values unchanged unless a pair fails)

## 2. Type roles

- [x] 2.1 In `components/shared/brand/typography.tsx` add the `caption` role (Archivo 500, 0.75rem, sentence case, no tracking) with its token in the scale in `global.css`, and ease `display` to width 112 / weight 800
- [x] 2.2 Drop the expanded width from `section` (weight 700) and `stat` (weight 800, tabular); remove the `type-expanded` / `type-semi-expanded` utilities in `global.css` that nothing uses any more
- [x] 2.3 Move form labels in `components/ui/form.tsx` from tracked uppercase to the `caption` look, keeping the error colour behaviour
- [x] 2.4 Review each `variant="label"` call site and move descriptive names to `caption`: `metadata-cell.tsx`, `connection-guide.tsx`, `deploy-page.tsx` (`deploy-ci`), `action-choice.tsx`, `created-key.tsx`, and the field names in `stack-detail.tsx` and `updates-section.tsx`; keep `label` for counters, status words, navigation, `Segmented` and the `SectionHeader` aside
- [x] 2.5 Check `PageHero` with the eased `display` at 360px in Spanish and English

## 3. Section numbers

- [x] 3.1 In `components/shared/layout/section-header.tsx` render the number in the muted tone instead of `signal`, and update its doc comment
- [x] 3.2 Stop passing `number` to the `SectionHeader`s of `features/stacks/components/stack-detail.tsx` (on top of its uncommitted edits); leave the overview sections numbered

## 4. Docs and specs

- [x] 4.1 Update `apps/frontend/DESIGN.md`: front matter colour and typography tokens, the Colors, Typography and Components sections, and the Mono-for-Facts and One Signal rules (section numbers are no longer orange; names versus facts)
- [x] 4.2 Check `openspec/config.yaml` and `AGENTS.md` wording against the new roles (the visual identity paragraph) and keep every cited path valid
- [x] 4.3 Run `openspec validate --all --strict`

## 5. Validation

- [x] 5.1 Run `bun run check-types`, `bunx biome check .` and `bun run tailwind:check`
- [x] 5.2 Ask the user to review both themes and both languages from the running app on `/`, `/stacks/<name>`, `/deploy`, `/credentials` and `/keys`, and to retake the README and site screenshots
