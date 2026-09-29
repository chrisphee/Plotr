---
name: Plotr
description: A calm desktop workspace for stories, with the project in a sidebar and every board as a soft card.
colors:
  pine: "#227A66"
  pine-hover: "#1C6B59"
  pine-text: "#1E705D"
  pine-soft: "rgba(34, 122, 102, 0.12)"
  pine-soft-strong: "rgba(34, 122, 102, 0.2)"
  on-accent: "#FFFFFF"
  accent-blue: "#0066D6"
  accent-violet: "#6A4BD8"
  accent-rose: "#C8365E"
  accent-orange: "#B4570F"
  accent-graphite: "#4B4B52"
  content-white: "#FFFFFF"
  sidebar-grey: "#F5F5F7"
  canvas: "#FAFAFB"
  sunken: "#F3F3F5"
  material: "rgba(252, 252, 253, 0.8)"
  fill: "rgba(0, 0, 0, 0.045)"
  fill-strong: "rgba(0, 0, 0, 0.075)"
  pressed: "rgba(0, 0, 0, 0.085)"
  ink: "#1D1D1F"
  secondary-grey: "#6E6E73"
  tertiary-grey: "#A1A1A6"
  separator: "rgba(0, 0, 0, 0.08)"
  separator-strong: "rgba(0, 0, 0, 0.14)"
  backdrop: "rgba(24, 24, 28, 0.22)"
  danger: "#D70015"
  danger-text: "#C4000F"
  danger-soft: "rgba(215, 0, 21, 0.09)"
  warning: "#C77700"
  dark-content: "#1B1B1D"
  dark-sidebar: "#232326"
  dark-canvas: "#19191B"
  dark-grouped: "#161618"
  dark-surface: "#252528"
  dark-surface-raised: "#2A2A2E"
  dark-material: "rgba(44, 44, 48, 0.8)"
  dark-ink: "#F2F2F4"
  dark-secondary: "#A1A1A8"
  dark-tertiary: "#6C6C72"
  dark-pine: "#29806C"
  dark-pine-text: "#62C4AC"
  dark-danger: "#D2332A"
  dark-danger-text: "#FF6961"
  dark-warning: "#FFB340"
typography:
  display:
    fontFamily: "Inter Variable, Inter, -apple-system, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 750
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter Variable, Inter, -apple-system, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.022em"
  title:
    fontFamily: "Inter Variable, Inter, -apple-system, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.012em"
  title-sm:
    fontFamily: "Inter Variable, Inter, -apple-system, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter Variable, Inter, -apple-system, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "-0.006em"
    fontFeature: "\"cv11\", \"calt\""
  body-prose:
    fontFamily: "Inter Variable, Inter, -apple-system, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "-0.011em"
  label:
    fontFamily: "Inter Variable, Inter, -apple-system, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 550
    lineHeight: 1.45
    letterSpacing: "-0.006em"
  caption:
    fontFamily: "Inter Variable, Inter, -apple-system, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 550
    lineHeight: 1.4
  mono:
    fontFamily: "ui-monospace, Cascadia Code, SF Mono, Consolas, monospace"
    fontSize: "0.9em"
rounded:
  xs: "5px"
  sm: "7px"
  md: "9px"
  lg: "12px"
  card: "14px"
  xl: "16px"
  sheet: "18px"
  full: "999px"
spacing:
  "1": "2px"
  "2": "4px"
  "3": "6px"
  "4": "8px"
  "5": "12px"
  "6": "16px"
  "7": "24px"
  "8": "32px"
  sidebar: "248px"
  header: "52px"
components:
  button-primary:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.on-accent}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 13px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.pine-hover}"
  button-secondary:
    backgroundColor: "{colors.content-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 13px"
    height: "32px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.secondary-grey}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
  button-ghost-on:
    backgroundColor: "{colors.pine-soft}"
    textColor: "{colors.pine-text}"
  button-destructive:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    height: "32px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.secondary-grey}"
    rounded: "{rounded.sm}"
    size: "30px"
  input:
    backgroundColor: "{colors.content-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 11px"
    height: "34px"
  search-field:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 10px 0 30px"
    height: "30px"
  pill-accent:
    backgroundColor: "{colors.pine-soft}"
    textColor: "{colors.pine-text}"
    rounded: "{rounded.full}"
    padding: "0 9px"
    height: "22px"
  pill-neutral:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.secondary-grey}"
    rounded: "{rounded.full}"
    padding: "0 9px"
    height: "22px"
  segmented-track:
    backgroundColor: "{colors.fill}"
    rounded: "{rounded.md}"
    padding: "2px"
    height: "30px"
  segmented-thumb:
    backgroundColor: "{colors.content-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
  switch-on:
    backgroundColor: "{colors.pine}"
    rounded: "{rounded.full}"
    width: "38px"
    height: "22px"
  sidebar-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "30px"
  sidebar-row-active:
    backgroundColor: "{colors.pine-soft}"
    textColor: "{colors.ink}"
  board-card:
    backgroundColor: "{colors.content-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "11px 8px 12px 13px"
  board-preview:
    backgroundColor: "{colors.sunken}"
    rounded: "9px"
    height: "116px"
  menu:
    backgroundColor: "{colors.material}"
    rounded: "{rounded.lg}"
    padding: "5px"
  menu-item-hover:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.sm}"
    height: "29px"
  modal:
    backgroundColor: "{colors.content-white}"
    rounded: "{rounded.xl}"
    width: "520px"
  note-sheet:
    backgroundColor: "{colors.content-white}"
    rounded: "{rounded.sheet}"
    width: "900px"
  settings-group:
    backgroundColor: "{colors.content-white}"
    rounded: "{rounded.lg}"
    padding: "9px 16px"
  kbd:
    backgroundColor: "{colors.content-white}"
    textColor: "{colors.secondary-grey}"
    rounded: "{rounded.xs}"
    padding: "0 5px"
    height: "19px"
---

# Design System: Plotr

## Overview

**Creative North Star: "The Sidebar and the Sheet"**

Plotr is a modern desktop app in the Craft and Apple Notes family. A cool grey sidebar holds the whole project tree at all times. Beside it, a white content area carries boards as soft rounded cards, and notes rise as a centred document sheet over a blurred board. The writer never loses place: the tree stays put while only the content area crossfades.

The system is quiet and dense in the way a good Mac app is dense. Text is small (13.5px UI), grey is used for everything secondary, and one accent does all the pointing. Depth comes from soft, layered, offset shadows with a hairline ring, never from borders alone. Motion is short and eased, and the two signature motions are a sliding segmented thumb and a smooth plot curve. It rejects the editorial book costume and the flat developer-tool column.

**Key Characteristics:**
- Two-pane frame: 248px grey sidebar, 52px header, white content column (max 1080px for pages).
- Inter Variable for every word, including note prose; negative tracking on all headings.
- One user-switchable accent (Pine default; Blue, Violet, Rose, Orange, Graphite).
- Soft layered shadows with a 0.5-1px ring; cards lift 2px on hover.
- Capsule chips, capsule zoom control, 9px controls, 14px cards, 16-18px sheets.
- Blurred material on menus, the search panel, floating canvas controls and the sheet backdrop.
- Full dark mode with a lighter accent text tone.

## Colors

A neutral Apple-grey palette with one accent that the writer chooses; the accent is the only saturated colour in the chrome.

### Primary
- **Modern Pine** (#227A66): the default accent. Primary buttons, the switch on state, menu row highlight, the plot curve and dots, the status dot, the project cover tile. Hover deepens to Pine Hover (#1C6B59).
- **Pine Text** (#1E705D): accent when it is text or an icon on a light ground (active sidebar icon, "Open" links, plot label numbers, textbuttons). It is darker than the fill tone for contrast.
- **Pine Wash** (rgba 12%) and **Pine Wash Strong** (rgba 20%): active sidebar row, ghost-button on state, accent pills, selection, hovered plot band, focus halo around inputs.

### Secondary
- **Accent alternates** (Blue #0066D6, Violet #6A4BD8, Rose #C8365E, Orange #B4570F, Graphite #4B4B52): the same role as Pine, swapped by App settings through `data-accent`. Each alternate defines its own hover, text, and two wash tones in light and dark. Build new accent-bearing UI on the accent role tokens, never on a literal pine value.

### Neutral
- **Content White** (#FFFFFF): the content area, cards, inputs, modals, the note sheet.
- **Sidebar Grey** (#F5F5F7): the sidebar and grouped settings pages.
- **Canvas** (#FAFAFB): the Plot Line and Info Map canvases.
- **Sunken** (#F3F3F5): the live preview well inside board cards.
- **Material** (rgba(252,252,253,0.8)): translucent surface under a 20-32px backdrop blur for menus, search and floating controls.
- **Fill / Fill Strong / Pressed** (4.5% / 7.5% / 8.5% black): control tracks, search field, hover and pressed states.
- **Ink** (#1D1D1F): primary text and the lower sheets of the logo.
- **Secondary Grey** (#6E6E73): meta lines, hints, icons, placeholders, inactive segments.
- **Tertiary Grey** (#A1A1A6): chevrons, breadcrumb separators, empty-preview icons, placeholder titles.
- **Separator** (8% black) and **Separator Strong** (14% black): hairlines, header rule on scroll, input rings, the dashed "New board" outline.
- **Danger** (#D70015), **Danger Text** (#C4000F), **Warning** (#C77700): destructive actions, errors, the pending-save dot.
- **Dark mode** swaps to Dark Content (#1B1B1D), Dark Sidebar (#232326), Dark Surface (#252528), Dark Ink (#F2F2F4); accent text lightens (Pine #62C4AC) while the accent fill stays mid-tone (#29806C).

### Named Rules
**The One Accent Rule.** The chrome has one saturated colour: the accent. Status, selection, the curve and the primary action all share it. Category colours are user data and live only on user content.

**The Two-Tone Accent Rule.** Accent as a fill uses the accent tone; accent as text or icon uses the accent text tone. Never set text in the fill tone.

## Typography

**Display Font:** Inter Variable (bundled via @fontsource-variable/inter with its optical-size axis, which the webview applies by font size; -apple-system, Segoe UI Variable and system-ui fallback)
**Body Font:** Inter Variable
**Label/Mono Font:** ui-monospace, Cascadia Code, SF Mono, Consolas (inline code in notes only)

**Character:** One grotesque for everything, tuned tight: headings run 650-750 weight with -0.01 to -0.03em tracking, UI text sits at 13.5px with the `cv11` single-storey a. Hierarchy comes from weight and grey, not from case or a second family.

### Hierarchy
- **Display** (750, 34px, 1.05): the Plotr name in the welcome window only.
- **Headline** (700, 30px, 1.15): page titles (project name on Home, folder names, settings pages) and the note title in the sheet.
- **Title** (650, 17px, 1.3): section titles ("Boards"), modal titles, empty-state titles, plot card titles.
- **Title Small** (600-650, 14.5px): board card names, type card names, Info Map card titles, the sidebar project name, the current breadcrumb.
- **Body** (400-450, 13.5px, 1.45): all UI text, sidebar rows, menu items, buttons (550).
- **Body Prose** (400, 16px, 1.7, max 68ch): the note editor. Editor headings: 24px/700, 19.5px/680, 16.5px/650.
- **Label** (500-600, 12.5px): meta lines, field labels, sidebar section heads, pills, segments, plot label titles. Sentence case.
- **Caption** (550-650, 11.5px): plot label numbers, plot card location, key caps (11px).

### Named Rules
**The Sentence Case Rule.** No uppercase, no letter-spaced small caps anywhere. Section heads such as "Boards" are sentence case at 12.5px/600 in secondary grey.

**The Tabular Count Rule.** Counts, zoom values and plot numbers use tabular figures.

## Layout

The app is a two-column grid: a 248px sidebar and a flexible main column. The sidebar collapses to 0 with Ctrl+\ over 280ms on the glide ease. The main column is a 52px header over a scrolling content area. The header gains a hairline only once content scrolls under it; on Home the breadcrumb fades in when the large page title scrolls away.

Scrolling pages centre a column of min(1080px, 100%) with 28px 40px 72px padding and 32px gaps between sections; narrow pages cap at 760px, grouped settings at 700px. Board cards fill an auto-fill grid with a 212px minimum and 16px gaps. Canvas boards (Plot Line, Info Map) fill the content area edge to edge with floating controls.

Spacing runs on a 2 / 4 / 6 / 8 / 12 / 16 / 24 / 32px scale. Responsive steps at 1180px (hide header subtitle), 1100px (header buttons collapse to icons), 1080, 1000, 980px (type cards stack) and 960px.

## Elevation & Depth

Hybrid: tonal layers (grey sidebar, white content, sunken preview wells) plus soft, layered shadows. Every shadow starts with a 0.5-1px ring that replaces a border, then adds a tight contact shadow and a wide negative-spread ambient shadow offset downward. Dark mode keeps the same stack with a white ring and deeper black.

### Shadow Vocabulary
- **Card** (`0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04), 0 3px 10px -4px rgba(0,0,0,0.06)`): board cards, type cards, settings groups, plot labels and act chips, Info Map cards.
- **Card Hover** (`0 0 0 1px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04), 0 14px 30px -10px rgba(0,0,0,0.16)`): with a 1-2px upward lift.
- **Float** (`0 0 0 0.5px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.05), 0 8px 24px -6px rgba(0,0,0,0.14)`): floating canvas controls.
- **Pop** (`0 0 0 0.5px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06), 0 14px 36px -6px rgba(0,0,0,0.2)`): menus and popovers.
- **Modal** (`0 0 0 0.5px rgba(0,0,0,0.12), 0 4px 14px rgba(0,0,0,0.06), 0 28px 80px -16px rgba(0,0,0,0.32)`): modals, the search panel, the note sheet.

### Named Rules
**The Ring, Not Border Rule.** Surfaces outline with a box-shadow ring (1px at rest, 0.5px on floating layers), not a CSS border. The dashed "New board" tile and Info Map groups are the only bordered shapes.

**The Blur Means Floating Rule.** Backdrop blur appears only on layers above the content: menus, search, the zoom capsule, tool rails, and modal and sheet backdrops.

## Shapes

Continuous, soft rounding that grows with the object: 5px key caps, 7px small buttons and rows, 9px buttons, inputs and segmented tracks, 12px menus and settings groups, 14px board cards (preview wells inset at 9px), 16px modals and the search panel, 18px for the note sheet and the welcome app icon. Chips, pills, the switch, the zoom control and plot labels are capsules. Dots and status indicators are circles. Nested radii step down by the inset so inner and outer corners stay concentric.

## Components

### Buttons
Compact, Mac-native, with a slight inner highlight on filled variants.
- **Shape:** gently rounded (9px); small 28px at 7px; large 38px at 12px.
- **Primary:** accent fill, white text, 550 weight, 32px tall, 13px side padding, `inset 0 1px 0 rgba(255,255,255,0.14), 0 1px 2px rgba(0,0,0,0.12)`.
- **Hover / Focus:** hover to the accent hover tone; press scales to 0.97; focus shows a 2px accent outline at 2px offset.
- **Secondary:** white with a strong-separator ring; hover mixes 5% ink. An accent-text variant and a danger-text variant share this shell.
- **Ghost:** transparent, secondary grey, 500 weight; hover fills 4.5%; the on state uses the accent wash and accent text.
- **Icon button:** 30px square, 7px radius, grey icon, hover fill.
- **Destructive:** danger fill with the primary's inner highlight.

### Chips
- **Style:** 22px capsules, 12.5px/500. Accent pill: accent wash with accent text. Neutral pill: fill with secondary grey.
- **State:** plot act chips are 26px white capsules with the card shadow; plot section tags inside the plot card are 20px fill capsules.

### Cards / Containers
- **Corner Style:** 14px for board cards, 12px for type cards and settings groups.
- **Background:** white surface; the board card carries a 116px live preview well (sunken grey, 6px inset) above an icon, name and meta line.
- **Shadow Strategy:** Card at rest, Card Hover plus a 2px lift on hover, 0.99 scale on press.
- **Border:** none; the ring in the shadow does that work. Focus draws a 2px background gap and a 2px accent ring.
- **Internal Padding:** 11-14px.

### Inputs / Fields
- **Style:** white, 9px radius, 34px tall, strong-separator ring, 14.5px text. Inside grouped settings rows they sit on the grouped grey with a lighter ring.
- **Focus:** 1px accent ring plus a 4px accent-wash halo; background turns white.
- **Search field:** 30px, fill background, leading icon at 9px, no ring until focus.
- **Error:** 12.5px danger text below the row.

### Navigation
- **Sidebar:** project switcher (40px, cover tile and 14.5px/650 name), a search button with Ctrl K key caps, Home, a "Boards" section with an add button, a folder tree with rotating chevrons and type icons, Trash and settings pinned at the foot above a hairline.
- **Rows:** 30px, 7px radius, 13.5px/450. Hover fills 4.5%. Active uses the accent wash, 560 weight, and accent-text icon.
- **Header:** sidebar toggle, a breadcrumb (secondary grey items, current item in ink at 650), view controls, and the primary action at the right.

### Segmented Control
A 30px fill track with a white thumb that slides under the active item over 300ms on the glide ease. Items are 12.5px/550; counts sit beside labels in tabular figures. The thumb carries `0 0 0 0.5px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.12)`.

### Switch
A 38 x 22px capsule; off is fill strong, on is the accent. The 18px white knob slides 16px over 260ms on the glide ease.

### Menu
A 12px-radius material popover with a 24px blur and the Pop shadow. Rows are 29px; hover and keyboard focus fill the row with the accent and turn text white. Danger rows fill with danger.

### Note Sheet
A 900px-wide, 18px-radius white document that rises (22px, 0.985 scale, 340ms glide) over a blurred, dimmed board. A 50px bar with a hairline holds close. The doc column is 700px with a 30px/700 title, a property grid (128px names), and 16px/1.7 Inter prose.

### Plot Curve
The signature. A monotone spline in the accent at 2.5px with round joins, a vertical accent gradient below it (16% to 0), and 2.5px-stroke white dots that fill with the accent when selected. Acts are alternating faint bands with white capsule chips. Moment labels are white capsules with an accent-text number and ink title.

### Spotlight Search
A 640px material panel at 14vh, 16px radius, 32px blur, Modal shadow. The input row is 56px with a 19px/450 input; results sit below a hairline.

## Do's and Don'ts

### Do:
- **Do** use the accent role tokens for every accent use, so all six accents and dark mode follow.
- **Do** outline surfaces with the ring inside the shadow stack, and lift hoverable cards 1-2px with the Card Hover shadow.
- **Do** keep UI text at 13.5px and meta at 12.5px in secondary grey; add hierarchy with weight and tight negative tracking.
- **Do** use capsules for chips, pills, switches and floating controls, and keep nested radii concentric.
- **Do** put blurred material only on layers that float above content.
- **Do** ease state changes in 140-200ms on `cubic-bezier(0.22, 1, 0.36, 1)` and sliding or rising motion in 260-340ms on `cubic-bezier(0.32, 0.72, 0, 1)`; crossfade only the content area between screens; drop all motion under reduced motion.

### Don't:
- **Don't** use a serif, a typewriter face, or a second sans; Inter carries every word, prose included.
- **Don't** set labels in uppercase or letter-spaced small caps.
- **Don't** add a second saturated chrome colour; category colours stay on user content.
- **Don't** draw hard, zero-blur offset shadows or solid 1px borders around cards.
- **Don't** hard-code the pine hex in new components.
