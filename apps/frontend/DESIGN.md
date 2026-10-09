---
name: Komodo CD
description: An operations bulletin for deploys — paper and ink, ruled lines instead of boxes, and one orange signal for whatever needs action.
colors:
  paper: "oklch(0.9818 0.0054 95.0986)"
  ink: "oklch(0.1908 0.002 106.5859)"
  wash: "oklch(0.9341 0.0153 90.239)"
  hairline: "oklch(0.94 0.003 97.3627)"
  field-rule: "oklch(0.78 0.008 98.3528)"
  graphite: "oklch(0.5341 0.0078 97.4503)"
  signal: "oklch(0.6724 0.1308 38.7559)"
  success: "oklch(0.51 0.154 150)"
  warning: "oklch(0.535 0.135 66)"
  info: "oklch(0.546 0.2 263)"
  code-slab: "oklch(0.17 0 0)"
  code-text: "oklch(0.95 0.004 100)"
  paper-dark: "oklch(0.2679 0.0036 106.6427)"
  ink-dark: "oklch(0.9576 0.0027 106.4494)"
  wash-dark: "oklch(0.2928 0.0018 106.5092)"
  hairline-dark: "oklch(0.31 0.004 106.8928)"
  field-rule-dark: "oklch(0.42 0.006 100.2195)"
  graphite-dark: "oklch(0.7713 0.0169 99.0657)"
  popover-dark: "oklch(0.3085 0.0035 106.6039)"
  signal-dark: "oklch(0.6724 0.1308 38.7559)"
  success-dark: "oklch(0.78 0.17 152)"
  warning-dark: "oklch(0.82 0.15 85)"
  info-dark: "oklch(0.72 0.15 255)"
  code-slab-dark: "oklch(0.12 0 0)"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 112"
  section:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  stat:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  label:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.1em"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: "0"
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
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    height: "40px"
    padding: "8px 16px"
  button-signal:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    height: "40px"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "40px"
    padding: "8px 16px"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-ghost-hover:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
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

Komodo CD looks like a printed operations bulletin: a sheet of warm paper, dark ink, and heavy rules that open each page and each section the way a bulletin's mastheads do. Nothing is boxed. Hairlines separate rows, a thick ink rule closes every header, and the page reads top to bottom like a report handed over at the end of a shift. It is built for someone who arrives after a push, a failed deploy or an ntfy alert, often on a phone, and wants to know in one glance what is wrong and what to press.

Colour is rationed. The whole interface is ink on paper (paper on ink in the dark theme), and a single orange, Signal Orange, marks what needs action or orientation: a problem, an available update, the action that deploys something new, the active item. Because it appears so rarely, it is read at once. State never floods a surface; it lives in an 8px dot and in the word beside it.

Type does the composing. Only the page title takes Archivo's wide, heavy cut, so it carries the weight of a masthead; the rest of the type is plain Archivo. JetBrains Mono in small caps is kept for facts and chrome (counters, status words, navigation, every technical value), so those feel like entries in a log, and names are set in quiet sentence-case Archivo. Corners are square everywhere, there are no shadows at rest, and no card has a background; structure comes from lines and from the rhythm of the type scale.

**Key Characteristics:**
- Paper and ink with one accent, Signal Orange, used only for what needs action or marks the current place.
- Rules instead of containers: a 1.5px ink rule opens and closes blocks, 1px hairlines divide what is inside them.
- Square corners (radius 0) on every control, panel and badge; only status dots are round.
- Archivo (wide and heavy for titles) paired with JetBrains Mono caps for labels and data.
- Both themes are first-class; secondary text passes 4.5:1 on its background in each.
- Dense but calm: 44px rows, short scannable lines, and the primary action always one click away.

## Colors

A near-monochrome editorial palette: warm off-white paper and ink with a warm tint (hue 95–107, the greys of garabato) in the greys of both themes, and a single orange accent. Light is the default theme; dark inverts ink and paper rather than inventing a second palette.

### Primary
- **Ink** (oklch(0.1908 0.002 106.5859); dark: Ink Light, oklch(0.9576 0.0027 106.4494)): the text colour, the thick rules, the default button fill, selection highlight and the inverted "open" row. It is the primary colour; the interface is mostly ink on paper.

### Secondary
- **Signal Orange** (oklch(0.6724 0.1308 38.7559), the same in dark): the only accent. It marks problems (also the danger and destructive colour), available updates, the signal button that launches a deploy, the active nav underline, link underlines and the focus ring.

### Tertiary
- **Go Green** (oklch(0.527 0.154 150); dark oklch(0.78 0.17 152)): running state and success, as a dot and as the word beside it.
- **Caution Amber** (oklch(0.554 0.135 66); dark oklch(0.82 0.15 85)): warnings and in-between states.
- **Link Blue** (oklch(0.546 0.2 263); dark oklch(0.72 0.15 255)): informational state, such as an action in progress.

### Neutral
- **Paper** (oklch(0.9818 0.0054 95.0986); dark: Night Paper, oklch(0.2679 0.0036 106.6427)): the page, panels, cards and popovers share it; there is no surface step between them in light.
- **Wash** (oklch(0.9341 0.0153 90.239); dark oklch(0.2928 0.0018 106.5092)): the only tint behind a control: hover on rows and ghost buttons, secondary and muted fills.
- **Hairline** (oklch(0.94 0.003 97.3627); dark oklch(0.31 0.004 106.8928)): the 1px dividers between rows and the dotted guest-screen texture.
- **Field Rule** (oklch(0.78 0.008 98.3528); dark oklch(0.42 0.006 100.2195)): the underline of unfocused inputs.
- **Graphite** (oklch(0.5341 0.0078 97.4503); dark oklch(0.7713 0.0169 99.0657)): secondary text, placeholders, inactive nav, empty status rings.
- **Code Slab** (oklch(0.17 0 0); dark oklch(0.12 0 0)): the code block is always dark in both themes, with code text oklch(0.95 0.004 100) and syntax tones for flags (oklch(0.78 0.08 300)), keywords (oklch(0.82 0.09 70)), URLs (oklch(0.8 0.07 220)), strings (oklch(0.8 0.09 160)), properties (oklch(0.78 0.08 254)) and placeholders (oklch(0.78 0.15 52)).

### Named Rules
**The One Signal Rule.** Signal Orange only appears where the reader needs to act or know where they are: a problem, an update, the deploy action, the current page. Section numbers are Graphite, not orange. If two things on a screen are orange and neither needs action, one of them is wrong.

**The Dot-and-Word Rule.** State colour (green, amber, blue, orange) lives only in the 8px dot and in the status word beside it. Never fill a row, badge or panel with a state colour.

**The Ink Inversion Rule.** Dark theme swaps ink and paper; it does not add a new palette. Accent and state tones lighten, they do not change hue.

## Typography

**Display Font:** Archivo (with ui-sans-serif, system-ui, sans-serif), a variable font with `wght` and `wdth` axes
**Body Font:** Archivo, regular weight
**Label/Mono Font:** JetBrains Mono (with ui-monospace, SFMono-Regular, monospace)

**Character:** Archivo stretched to width 112 at weight 800 gives the page title the density of a masthead and is the only expanded text; everywhere else it is a neutral, readable grotesque. JetBrains Mono in widely tracked caps is the bulletin's index: counters, status words, nav, and anything that is a value to copy.

### Hierarchy
- **Display** (800, 2.75rem, 0.95; up to 4.5rem on large screens in page heroes, -0.03em, width 112): the page title, one per page, balanced and allowed to wrap anywhere.
- **Section** (700, 1.5rem, 1.15, -0.02em): section titles, at normal width.
- **Stat** (800, 2.25rem, 1, tabular numerals): the large figures in the count strip.
- **Headline** (700, 1rem, 1.35, -0.025em): row names, panel titles, block headings.
- **Body** (400, 0.875rem, 1.5): prose and the default for anything unstyled.
- **Caption** (Archivo, 500, 0.75rem, 1.4, sentence case, usually muted): the name of a field or of an explanatory block, such as a form label or a metadata field name.
- **Meta** (400, 0.8125rem, 1.45): descriptions and hints under a headline; muted, capped near `max-w-prose`.
- **Label** (JetBrains Mono, 500, 0.6875rem, 1.3, 0.1em, uppercase): counters, nav, filter tabs, status words and table column headers. 11px is the readable floor; nothing is set smaller.
- **Data** (JetBrains Mono, 400, 0.75rem, tabular numerals, ligatures off): commits, hashes, URLs, curl snippets, any technical value that may be copied verbatim.

### Named Rules
**The Role-Not-Size Rule.** Type is chosen by role (display, section, stat, headline, body, meta, caption, label, data), through the shared `Text` component, never by composing size, weight and tracking locally. A new text is one of the existing roles or the scale gets a new role.

**The Mono-for-Facts Rule.** Anything that is a value rather than a sentence (counts, ids, hashes, URLs, status words) is JetBrains Mono, tabular, with ligatures off. Prose never is, and neither is the name of a field or a block: that is a `caption`, not a tracked uppercase `label`.

## Layout

A ruled single column. Regular pages sit in a centred column (max width 72rem) with side gutters of 16px, 24px and 40px from small to large screens; the top bar uses the same gutters at full width. The stacks page is the one exception: a master–detail layout bleeding to the viewport edge, with the list as a fixed-head, independently scrolling column and the selected stack's detail beside it.

Structure is built from lines, not containers. A page hero (display title, muted description, counters and one action on the right) ends in a 1.5px ink rule; numbered section headers ("01 Services") sit on the same rule; panels sit between a thick top rule and a hairline bottom; lists are divided by hairlines. Spacing is generous between blocks (24–40px) and tight inside rows (44px high).

Responsive behaviour is anchored at the `lg` breakpoint (1024px). Below it, the horizontal top-bar navigation is replaced by a fixed 64px bottom tab bar (icon above label, six columns, safe-area aware) and the page reserves room for it. Icon-only buttons are 24–40px with a mouse, but grow an invisible 44×44px hit area under a coarse pointer. Form text is 16px on mobile to prevent zoom and 14px from `md`.

### Named Rules
**The Rule-Not-Box Rule.** Group with a 1.5px ink rule on top and a hairline underneath. Do not add a background, border or shadow to make a block look like a card.

**The Thumb Rule.** Every control that matters in an incident must be reachable and tappable on a phone: 44px minimum targets, primary navigation at the bottom, no hover-only affordances.

## Elevation & Depth

Flat. Hierarchy comes from the thick/thin rule vocabulary and from the type scale, not from shadows or layered surfaces: paper, card and page share one background. Exceptions are limited to things that float over the page, each with a 1.5px ink border plus a shadow: the combobox list (`shadow-md`), toasts and the sticky bulk-action bar (both `shadow-lg`). One more is the active nav link, whose 2px orange underline is drawn as an inset shadow to sit on the bar's rule. In the dark theme popovers step up one tone (oklch(0.3085 0.0035 106.6039)). The only filled slab is the always-dark code block.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest and have no shadow. A shadow is allowed only for something that floats above the page (a popover list, a toast, the sticky bulk bar), always with the 1.5px ink border, never to make a panel look raised.

**The Invert-To-Select Rule.** The selected row inverts to ink background with paper text (and a Signal checkbox); selection is shown by inversion and by `aria-current`, not by a tint or border.

## Shapes

Square. Every radius token resolves to 0: buttons, inputs, panels, badges, avatars (a 28px square with a 1.5px ink outline holding the user's initial) and popovers. The only round shapes are status dots (full circle, 8px) and loading spinners. Strokes are 1.5px for ink rules, control outlines and field underlines, and 1px for hairlines. Empty and error states are a gap between two dashed rules with a flat 1.5-weight line icon, never a framed box. The guest screens (login, 404) get a flat texture of hairline-coloured dots masked on the paper, with no gradient.

## Components

### Buttons
- **Shape:** square (0 radius) with a 1.5px border that matches the fill, so variants never shift size.
- **Primary (default):** ink fill, paper text, 40px high, 16px horizontal padding, semibold 14px. Hover lowers the fill to 85% opacity.
- **Signal:** Signal Orange fill, paper text. Reserved for the single action that launches something new (a deploy).
- **Destructive:** shares the Signal fill; it is the same colour, so danger and action read as one system.
- **Outline:** transparent with a 1.5px ink border; on hover it inverts to ink fill with paper text.
- **Secondary / Ghost / Link:** secondary has a Wash fill; ghost is bare and takes Wash on hover; link has no border and an orange underline with 4px offset that turns the text orange on hover.
- **Sizes:** xs 24px, sm 32px, default 40px, lg 44px, plus matching square icon sizes.
- **Focus / Disabled / Pending:** a 2px Signal ring with a 2px paper offset; disabled is 50% opacity with no pointer events; `loading` replaces the leading icon with a spinner and disables the button. Destructive actions confirm with a second click in the same place (`useConfirm`) or inline (`InlineConfirm`).

### Inputs / Fields
- **Style:** underlined, not boxed: transparent background, only a 1.5px bottom rule in ink, 40px high, zero horizontal padding, Graphite placeholder.
- **Focus:** the bottom rule turns Signal Orange. **Error:** the same rule takes the destructive colour (Signal). **Disabled:** 50% opacity.
- **Labels:** form labels are the `caption` role (Archivo, sentence case, 12px, Graphite), turning Signal when the field is in error. Checkboxes and radios use native controls with the accent set to ink (Signal on an inverted row).

### Navigation
- **Top bar (desktop):** 56px, sticky, paper background with a 1.5px ink rule beneath. The "KOMODO/CD" wordmark in wide extrabold Archivo sits left; links are mono caps in Graphite that go to Ink when active, with a 2px Signal underline drawn at the bottom of the bar. Avatar, theme toggle and language switcher sit right.
- **Bottom bar (mobile):** fixed 64px, 1.5px ink rule on top, six columns of icon above a mono label; the active item gets a 2px Signal line along its top edge, an orange icon and ink text. It does not fade between pages.

### Filter tabs (Segmented)
- Mono-caps options on native radios; the chosen option is ink with a 2px Signal underline, never a fill. A count follows the label and turns Signal when it flags a problem. A `tabs` variant sits flush on a block's rule (the code block's tab bar).

### Stack list row (signature)
- A 44px row with a selection checkbox, a link to the stack, a state dot, the name (semibold, truncated), one marker and a service count in mono. Hover tints the row Wash; the open stack inverts to ink. Exactly one marker shows, by priority: an action in progress (spinner), then a problem (warning triangle in Signal), then an "update" tag in Signal. The list scrolls on its own under a fixed header with search, filters and select-all.

### Status tags
- A status is an 8px dot plus a mono-caps word. The word is Graphite by default and takes the state colour only when attention is needed; neutral states (stopped, unknown) are a hollow ring. Active actions pulse the dot.

### Page hero, section header, count strip
- **Page hero:** display title, muted description, then counters, status and one action aligned to the right baseline; closed by a 1.5px ink rule.
- **Section header:** optional two-digit Graphite number in mono ("01"), used only where the sections are ranked (the overview, by urgency) and never in the stack detail; section-role title, a muted mono note and an optional action, resting on a 1.5px rule.
- **Count strip:** a 1.5px ink rule on the left, then cells separated by hairlines: mono label above, a stat-size figure below, Signal for what needs action and Graphite for the total.

### Code block
- A hairline-light bar on the page (label or tabs plus a ghost Copy button) over a flat dark slab with mono 12px text at 24px line height. Dark in both themes so the curl snippets for CI read the same everywhere.

### Feedback
- **State card:** a full-width gap between two dashed rules with a 40px thin line icon, a headline, muted copy and a single action.
- **Toasts:** report the outcome of a mutation through the shared toaster; Komodo errors (502/503) are written out, never swallowed.

## Do's and Don'ts

### Do:
- **Do** build every block with a 1.5px ink top rule and 1px hairlines inside; let rules, not boxes, carry the structure.
- **Do** spend Signal Orange only on what needs action, marks the current place, or launches a deploy; keep it to a few marks per screen.
- **Do** choose type through the `Text` roles (display, section, stat, headline, body, meta, label, data) and set every value, id, count and status word in JetBrains Mono.
- **Do** keep radius at 0 and strokes at 1.5px (rules and outlines) or 1px (hairlines).
- **Do** give state as an 8px dot plus a word; show a failure or missing Komodo connection as an explicit state card with the next step.
- **Do** keep both themes and both languages at parity, with secondary text at 4.5:1 or better.
- **Do** keep 44px touch targets and put primary navigation at the bottom on phones.
- **Do** compose the shared pieces (`PageHero`, `SectionHeader`, `StatStrip`, `Panel`, `StateCard`, `Segmented`, `CodeBlock`, `Button` with `icon` and `loading`) before writing a new one.

### Don't:
- **Don't** wrap content in rounded, shadowed or tinted cards; a panel is a rule, not a container.
- **Don't** fill rows, badges or alerts with state colours; no green, amber or red backgrounds.
- **Don't** introduce another accent colour, a gradient, or a hard-coded colour, radius or font; use the tokens in `global.css`.
- **Don't** use a generic SaaS metrics dashboard pattern: a grid of identical tiles with decorative KPIs.
- **Don't** set text under 11px or hide meaning in colour alone; a state always has a word or an accessible name.
- **Don't** use hover as the only way to reveal an action, and don't ship a layout that needs horizontal scrolling on a phone.
- **Don't** add decorative motion; use the 0.2s page fade, colour transitions on controls and the circular theme reveal, and a pulse or spinner only for work in progress.
