---
name: Komodo CD
description: An operations bulletin for deploys — warm paper and ink, ruled lines instead of boxes, and one orange for whatever needs action.
colors:
  paper: "oklch(0.9818 0.0054 95.0986)"
  ink: "oklch(0.3438 0.0269 95.7226)"
  rule: "oklch(0.1908 0.002 106.5859)"
  wash: "oklch(0.9341 0.0153 90.239)"
  hairline: "oklch(0.94 0.003 97.3627)"
  control-edge: "oklch(0.92 0.004 98.3528)"
  graphite: "oklch(0.5341 0.0078 97.4503)"
  popover: "oklch(1 0 0)"
  signal: "oklch(0.6724 0.1308 38.7559)"
  signal-ink: "oklch(0.52 0.14 38.7559)"
  danger: "oklch(0.52 0.2078 25.3313)"
  success: "oklch(0.51 0.154 150)"
  warning: "oklch(0.535 0.135 66)"
  info: "oklch(0.546 0.2 263)"
  code-slab: "oklch(0.17 0 0)"
  code-text: "oklch(0.95 0.004 100)"
  paper-dark: "oklch(0.2679 0.0036 106.6427)"
  ink-dark: "oklch(0.9576 0.0027 106.4494)"
  rule-dark: "oklch(0.9818 0.0054 95.0986)"
  wash-dark: "oklch(0.2213 0.0038 106.707)"
  hairline-dark: "oklch(0.31 0.004 106.8928)"
  control-edge-dark: "oklch(0.34 0.005 100.2195)"
  graphite-dark: "oklch(0.7713 0.0169 99.0657)"
  popover-dark: "oklch(0.3085 0.0035 106.6039)"
  signal-ink-dark: "oklch(0.72 0.13 40)"
  danger-dark: "oklch(0.7 0.1978 25.3313)"
  success-dark: "oklch(0.78 0.17 152)"
  warning-dark: "oklch(0.82 0.15 85)"
  info-dark: "oklch(0.72 0.15 255)"
  code-slab-dark: "oklch(0.2 0 0)"
typography:
  display:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  section:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  stat:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  label:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.12em"
  status:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.08em"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: "0"
  sm: "2px"
  md: "4px"
  lg: "6px"
  dot: "9999px"
spacing:
  gutter-sm: "16px"
  gutter-md: "24px"
  gutter-lg: "40px"
  top-bar: "56px"
  bottom-bar: "64px"
  row: "44px"
components:
  button-primary:
    backgroundColor: "{colors.signal}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "8px 16px"
  button-outline-hover:
    backgroundColor: "{colors.wash}"
  button-ghost-hover:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
  button-destructive:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "8px 16px"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "40px"
    padding: "4px 0"
  nav-link:
    textColor: "{colors.graphite}"
    typography: "{typography.label}"
  nav-link-active:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
  list-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    height: "44px"
  list-row-open:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    height: "44px"
  code-block:
    backgroundColor: "{colors.code-slab}"
    textColor: "{colors.code-text}"
    typography: "{typography.data}"
    padding: "16px 20px"
---

# Design System: Komodo CD

## Overview

**Creative North Star: "The Operations Bulletin"**

Komodo CD looks like a printed operations bulletin: a sheet of warm, slightly olive paper, dark ink, and heavy rules that open each page and each section the way a bulletin's mastheads do. Nothing is boxed. Hairlines separate rows, a thick ink rule closes every header, and the page reads top to bottom like a report handed over at the end of a shift. It is built for someone who arrives after a push, a failed deploy or an ntfy alert, often on a phone, and wants to know in one glance what is wrong and what to press.

The palette, the type and the control shapes are shared with the sibling product garabato: the same paper and ink greys, the same brand orange, Schibsted Grotesk for words and JetBrains Mono for values, and the same softly rounded buttons. What stays Komodo's own is the composition: ruled blocks instead of cards, a page title that carries the weight of a masthead, and an underlined top navigation. Colour is rationed: the orange marks the action to take and the place you are, and state never floods a surface; it lives in an 8px dot and the word beside it.

**Key Characteristics:**
- Warm paper and ink with one orange, Signal, used for the main action, the current place and what needs attention.
- Rules instead of containers: a 1.5px ink rule opens and closes blocks, 1px hairlines divide what is inside them.
- Controls have 4px corners and a 3px focus ring; blocks, panels, inputs and lists stay square.
- Schibsted Grotesk for words (the page title in extra-bold), JetBrains Mono for values and for navigation chrome.
- Both themes are first-class; secondary text passes 4.5:1 on its background in each.
- Dense but calm: 44px rows, short scannable lines, and the primary action always one click away.

## Colors

A near-monochrome editorial palette: warm paper and olive-tinted ink (hue 90–107, the greys of garabato) and a single brand orange. Light is the default theme; dark moves to a warm charcoal and lightens the accents, it does not invent a second palette.

### Primary
- **Signal Orange** (oklch(0.6724 0.1308 38.7559), the same in both themes): the brand colour and the primary action. It fills the default and signal buttons (white text), the focus ring, text selection and the caret, the active nav underline, the active bottom-tab line, link underlines and the "update" and attention marks. It is a fill and a stroke, not a text colour.
- **Signal Ink** (oklch(0.52 0.14 38.7559); dark oklch(0.72 0.13 40)): the same hue pulled to 5:1+ against the paper, for orange *text* at small sizes: an attention count, the update tag, a changed commit, an inline link.

### Secondary
- **Danger Red** (oklch(0.52 0.2078 25.3313); dark oklch(0.7 0.1978 25.3313)): destructive buttons, form errors, error states and the danger dot. It is a separate hue from Signal so that "act on this" and "this is broken" no longer read as one colour.

### Tertiary
- **Go Green** (oklch(0.51 0.154 150); dark oklch(0.78 0.17 152)): running state and success, as a dot and as the word beside it.
- **Caution Amber** (oklch(0.535 0.135 66); dark oklch(0.82 0.15 85)): warnings and in-between states.
- **Link Blue** (oklch(0.546 0.2 263); dark oklch(0.72 0.15 255)): informational state, such as an action in progress.

### Neutral
- **Paper** (oklch(0.9818 0.0054 95.0986); dark: Night Paper, oklch(0.2679 0.0036 106.6427)): the page, panels and the bars; blocks are not given a surface step of their own.
- **Ink** (oklch(0.3438 0.0269 95.7226); dark oklch(0.9576 0.0027 106.4494)): the text colour, the fill of the inverted "open" row and of the outline-button hover in dark.
- **Rule Ink** (oklch(0.1908 0.002 106.5859); dark oklch(0.9818 0.0054 95.0986)): the stroke of the 1.5px rules that open and close blocks and bars, and the underline of an input. Darker than the text, so rules read as lines drawn in the same pen but pressed harder.
- **Wash** (oklch(0.9341 0.0153 90.239); dark oklch(0.2213 0.0038 106.707)): the tint behind a control: hover on rows and ghost buttons, secondary and muted fills, skeletons.
- **Hairline** (oklch(0.94 0.003 97.3627); dark oklch(0.31 0.004 106.8928)): the 1px dividers between rows and cells, and the dotted guest-screen texture.
- **Control Edge** (oklch(0.92 0.004 98.3528); dark oklch(0.34 0.005 100.2195)): the outline of the outline button and of a choice card.
- **Graphite** (oklch(0.5341 0.0078 97.4503); dark oklch(0.7713 0.0169 99.0657)): secondary text, placeholders, inactive nav, hollow status rings.
- **Popover** (oklch(1 0 0); dark oklch(0.3085 0.0035 106.6039)): toasts and the bulk-action bar. Dropdown lists use Paper with a hairline border instead.
- **Code Slab** (oklch(0.17 0 0); dark oklch(0.2 0 0)): the code block is always dark in both themes, with code text oklch(0.95 0.004 100) and syntax tones for flags (oklch(0.78 0.08 300)), keywords (oklch(0.82 0.09 70)), URLs (oklch(0.8 0.07 220)), strings (oklch(0.8 0.09 160)), properties (oklch(0.78 0.08 254)) and placeholders (oklch(0.78 0.15 52)).

### Named Rules
**The One Signal Rule.** Signal Orange appears where the reader must act or knows where they are: the action button, the current page, a problem or an update. A screen carries a few orange marks, not a field of them. If two things on a screen are orange and neither needs action, one of them is wrong.

**The Fill-Not-Text Rule.** Brand orange is a fill or a stroke (3:1 against the paper). Orange text smaller than a heading is Signal Ink, never the brand orange. White on the brand orange is 3.1:1, so button labels stay 14px medium or heavier.

**The Dot-and-Word Rule.** State colour (green, amber, blue, red) lives only in the 8px dot and in the status word beside it. Never fill a row, badge or panel with a state colour.

**The Ink Inversion Rule.** Dark theme swaps ink and paper; it does not add a new palette. Accent and state tones lighten, they do not change hue.

## Typography

**Display and Body Font:** Schibsted Grotesk (with ui-sans-serif, system-ui, sans-serif), a variable font, weights 400–900
**Mono Font:** JetBrains Mono (with ui-monospace, SFMono-Regular, monospace)

**Character:** Schibsted Grotesk is a sober, slightly condensed news grotesque. At weight 800 and tight tracking it gives the page title the density of a masthead; at 400–500 it stays quiet. JetBrains Mono is the bulletin's index: every value to copy and the navigation chrome.

### Hierarchy
- **Display** (800, 2.75rem, 0.95, -0.03em; up to 4.5rem on large screens in page heroes): the page title, one per page, balanced and allowed to wrap anywhere.
- **Section** (600, 1.125rem, 1.3, -0.025em): section titles.
- **Stat** (500, 1.5rem, 1.1, tabular numerals): the large figures in the count strip.
- **Headline** (500, 1rem, 1.4, -0.025em): row names, panel titles, block headings.
- **Body** (400, 0.875rem, 1.5): prose and the default for anything unstyled.
- **Meta** (400, 0.8125rem, 1.45): descriptions and hints under a headline; muted, capped near `max-w-prose`.
- **Caption** (500, 0.75rem, 1.4, sentence case, usually muted): the name of a field or of an explanatory block, such as a form label or a metadata field name.
- **Label** (500, 0.6875rem, 1.3, 0.12em, uppercase): counters, filter tabs and table column headers. 11px is the readable floor; nothing is set smaller.
- **Status** (500, 0.6875rem, 1.3, 0.08em, uppercase): the word that follows a status dot.
- **Data** (JetBrains Mono, 400, 0.75rem, tabular numerals, ligatures off): commits, hashes, URLs, curl snippets, any technical value that may be copied verbatim.

### Named Rules
**The Role-Not-Size Rule.** Type is chosen by role (display, section, stat, headline, body, meta, caption, label, status, data), through the shared `Text` component, never by composing size, weight and tracking locally. A new text is one of the existing roles or the scale gets a new role.

**The Mono-for-Facts Rule.** Anything that is a value rather than a sentence (ids, hashes, URLs, commits, snippets) is JetBrains Mono, tabular, with ligatures off. The navigation links and the bottom tab labels are also mono caps, as chrome. Prose is never mono, and neither is the name of a field or block: that is a `caption`, not a tracked uppercase `label`.

## Layout

A ruled single column. Regular pages sit in a centred column (max width 72rem) with side gutters of 16px, 24px and 40px from small to large screens; the top bar uses the same gutters at full width. The stacks page is the one exception: a master–detail layout bleeding to the viewport edge, with the list as a fixed-head, independently scrolling column and the selected stack's detail beside it.

Structure is built from lines, not containers. A page hero (display title, muted description, counters and one action on the right) ends in a 1.5px ink rule; numbered section headers ("01 Services") sit on the same rule; panels sit between a thick top rule and a hairline bottom; lists are divided by hairlines. Spacing is generous between blocks (24–40px) and tight inside rows (44px high).

Responsive behaviour is anchored at the `lg` breakpoint (1024px). Below it, the horizontal top-bar navigation is replaced by a fixed 64px bottom tab bar (icon above label, one column per surface, safe-area aware) and the page reserves room for it. Icon-only buttons are 24–36px with a mouse, but grow an invisible 44×44px hit area under a coarse pointer. Form text is 16px on mobile to prevent zoom and 14px from `md`.

### Named Rules
**The Rule-Not-Box Rule.** Group with a 1.5px ink rule on top and a hairline underneath. Do not add a background, border or shadow to make a block look like a card.

**The Thumb Rule.** Every control that matters in an incident must be reachable and tappable on a phone: 44px minimum targets, primary navigation at the bottom, no hover-only affordances.

## Elevation & Depth

Flat at rest. Hierarchy comes from the thick/thin rule vocabulary and from the type scale, not from layered surfaces: paper and blocks share one background. Only things that float over the page cast a soft, low shadow (garabato's scale): the dropdown lists (`shadow-md` over a 1px hairline border on Paper), toasts (`shadow-lg`, 1px border, 6px corners) and the sticky bulk-action bar (`shadow-lg` under a 1.5px ink border). Outline buttons carry `shadow-xs`. The active nav link has a 2px orange underline drawn as an inset shadow that sits on the bar's rule. In the dark theme popovers step up one tone (oklch(0.3085 0.0035 106.6039)). The only filled slab is the always-dark code block.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. A shadow is allowed only for something that floats above the page (a dropdown list, a toast, the sticky bulk bar), never to make a panel look raised.

**The Invert-To-Select Rule.** The selected row inverts to an ink background with paper text (and a Signal checkbox); selection is shown by inversion and by `aria-current`, not by a tint or border.

## Shapes

Blocks are square; controls are soft. Panels, lists, rows, inputs (underlined, 0 radius), state cards, the hero and the code block are square-cornered and drawn with rules. Buttons, choice cards, badges and the toast have small radii from garabato's scale (buttons and choice cards 4px, kbd chips 2px, toasts 6px). The only round shapes are status dots (full circle, 8px) and loading spinners. Strokes are 1.5px for ink rules and field underlines, and 1px for hairlines and control outlines. Empty and error states are a gap between two dashed rules with a flat 1.5-weight line icon, never a framed box. The guest screens (login, 404) get a flat texture of hairline-coloured dots masked on the paper, with no gradient.

## Components

### Buttons
- **Shape:** 4px corners, no border on filled variants, so variants never shift size.
- **Primary (default) and Signal:** Signal Orange fill, white text, 36px high, 16px horizontal padding, medium 14px. Hover drops the fill to 90%. `signal` is an alias for the same look and marks the action that launches something new (a deploy).
- **Destructive:** Danger Red fill, white text (60% fill in dark); confirms with a second click in the same place (`useConfirm`) or inline (`InlineConfirm`).
- **Outline:** Paper fill, 1px border, `shadow-xs`; hover takes the Wash tint (accent). In dark the border is Control Edge and the fill a 30% tint of it.
- **Secondary / Ghost / Link:** secondary has the soft secondary fill; ghost is bare and takes the accent tint on hover; link is orange text with an underline on hover.
- **Sizes:** xs 24px, sm 32px, default 36px, lg 40px, plus matching square icon sizes (24, 32, 36).
- **Focus / Disabled / Pending:** a 3px ring in Signal at 50% opacity and a Signal border; disabled is 50% opacity and grayscale with no pointer events; `loading` replaces the leading icon with a spinner and disables the button.

### Inputs / Fields
- **Style:** underlined, not boxed: transparent background, only a 1.5px bottom rule in Rule Ink, 40px high, zero horizontal padding, Graphite placeholder. A search icon sits inside the line, inset from the left edge.
- **Focus:** the bottom rule turns Signal Orange. **Error:** the same rule takes Danger Red. **Disabled:** 50% opacity.
- **Labels:** form labels are the `caption` role (sentence case, 12px, Graphite), turning Danger Red when the field is in error. Checkboxes and radios use native controls with the accent set to the brand orange (Signal on an inverted row).

### Navigation
- **Top bar (desktop):** 56px, sticky, paper background with a 1.5px Rule Ink line beneath. The "KOMODO/CD" wordmark in bold Schibsted Grotesk sits left; links are mono caps in Graphite that go to Ink when active, with a 2px Signal underline drawn at the bottom of the bar. The stack search (underlined field, magnifier inset 8px) shares the bar with the theme and language controls.
- **Bottom bar (mobile):** fixed 64px, 1.5px Rule Ink line on top, one column per surface of icon above a mono label; the active item gets a 2px Signal line along its top edge, an orange icon and ink text. It does not fade between pages.

### Filter tabs (Segmented)
- Caps options on native radios; the chosen option is Ink with a 2px Signal underline, never a fill. A count follows the label and turns Signal Ink when it flags a problem. A `tabs` variant sits flush on a block's rule (the code block's tab bar).

### Stack list row (signature)
- A 44px row with a selection checkbox, a link to the stack, a state dot, the name (semibold, truncated), one marker and a service count in mono. Hover tints the row Wash; the open stack inverts to ink. Exactly one marker shows, by priority: an action in progress (spinner), then a problem (warning triangle in Signal Ink), then an "update" tag in Signal Ink. The list scrolls on its own under a fixed header with search, filters and select-all.

### Dropdown lists
- The stack suggestions on the deploy form and the top-bar search: Paper background, a 1px hairline border and `shadow-md`, rows of 36–40px divided by hairlines with the name in semibold and the status word at the right; the highlighted row takes the Wash tint. No rounded items and no thick ink frame.

### Status tags
- A status is an 8px dot plus a caps word. The word is Graphite by default and takes the state colour only when attention is needed; neutral states (stopped, unknown) are a hollow ring. Active actions pulse the dot.

### Page hero, section header, count strip
- **Page hero:** display title, muted description, then counters, status and one action aligned to the right baseline; closed by a 1.5px ink rule.
- **Section header:** optional two-digit Graphite number ("01"), used only where the sections are ranked (the overview, by urgency) and never in the stack detail; section-role title, a muted note and an optional action, resting on a 1.5px rule.
- **Count strip:** a 1.5px ink rule on the left, then cells separated by hairlines: label above, a stat-size figure below, Signal Ink for what needs action and Graphite for the total.

### Code block
- A bar on the page (label or tabs plus a ghost Copy button) resting on a 1.5px rule, over a flat dark slab with mono 12px text at 24px line height. Dark in both themes so the curl snippets for CI read the same everywhere.

### Feedback
- **State card:** a full-width gap between two dashed rules with a 40px thin line icon, a headline, muted copy and a single action.
- **Toasts:** report the outcome of a mutation through the shared toaster (Popover fill, 1px border, 6px corners); Komodo errors (502/503) are written out, never swallowed.

## Do's and Don'ts

### Do:
- **Do** build every block with a 1.5px ink top rule and 1px hairlines inside; let rules, not boxes, carry the structure.
- **Do** spend Signal Orange on the main action, the current place and what needs attention; keep it to a few marks per screen, and use Signal Ink for orange text.
- **Do** choose type through the `Text` roles (display, section, stat, headline, body, meta, caption, label, status, data) and set every value, id and snippet in JetBrains Mono.
- **Do** keep blocks, inputs and lists square, controls at 4px, and strokes at 1.5px (rules, field underlines) or 1px (hairlines, control outlines).
- **Do** give state as an 8px dot plus a word; show a failure or missing Komodo connection as an explicit state card with the next step.
- **Do** keep both themes and both languages at parity, with secondary text at 4.5:1 or better.
- **Do** keep 44px touch targets and put primary navigation at the bottom on phones.
- **Do** compose the shared pieces (`PageHero`, `SectionHeader`, `StatStrip`, `Panel`, `StateCard`, `Segmented`, `CodeBlock`, `Button` with `icon` and `loading`) before writing a new one.

### Don't:
- **Don't** wrap content in rounded, shadowed or tinted cards; a panel is a rule, not a container.
- **Don't** fill rows, badges or alerts with state colours; no green, amber or red backgrounds.
- **Don't** use brand orange for small text, or introduce another accent colour, a gradient, or a hard-coded colour, radius or font; use the tokens in `global.css`.
- **Don't** put a thick ink frame on a dropdown or a popover; a hairline and a soft shadow are enough.
- **Don't** use a generic SaaS metrics dashboard pattern: a grid of identical tiles with decorative KPIs.
- **Don't** set text under 11px or hide meaning in colour alone; a state always has a word or an accessible name.
- **Don't** use hover as the only way to reveal an action, and don't ship a layout that needs horizontal scrolling on a phone.
- **Don't** add decorative motion; use the 0.2s page fade, colour transitions on controls and the circular theme reveal, and a pulse or spinner only for work in progress.
