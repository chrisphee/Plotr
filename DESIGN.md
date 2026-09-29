---
name: Plotr
description: A quiet workspace for stories, set as a book in proof.
colors:
  pine: "#29524A"
  pine-deep: "#1D3C36"
  pine-wash: "#E4EDEA"
  pine-ink: "#1E3B38"
  galley-white: "#FFFFFF"
  proof-band: "#F7F7F5"
  desk: "#F3F3F0"
  ink: "#141414"
  graphite: "#5F5F66"
  faint-graphite: "#A3A3A8"
  hairline: "#E4E4E0"
  hairline-strong: "#CFCFCA"
  leader: "#BDBDB8"
  red-pencil: "#B3372C"
  pine-negative: "#72B0A1"
  pine-negative-hover: "#8CC3B5"
  pine-negative-wash: "#1A2A26"
  pine-negative-ink: "#A9D3C8"
  film-black: "#111214"
  film-band: "#151619"
  film-surface: "#17181B"
  film-desk: "#0C0D0E"
  film-hover: "#1C1E21"
  negative-type: "#ECEBE6"
  negative-graphite: "#A2A2A8"
  negative-faint: "#56585E"
  negative-hairline: "#25272B"
  negative-hairline-strong: "#34363B"
  negative-leader: "#3E4045"
  red-pencil-negative: "#C04A3E"
  category-character: "#7C5CBF"
  category-location: "#3F9A5A"
  category-conflict: "#C8503F"
  category-lore: "#3B7DD8"
typography:
  display:
    fontFamily: "Source Serif 4 Variable, Source Serif 4, Georgia, serif"
    fontSize: "44px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
    fontVariation: "\"opsz\" 60"
  headline:
    fontFamily: "Source Serif 4 Variable, Source Serif 4, Georgia, serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.015em"
    fontVariation: "\"opsz\" 48"
  board-title:
    fontFamily: "Source Serif 4 Variable, Source Serif 4, Georgia, serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.015em"
    fontVariation: "\"opsz\" 40"
  title:
    fontFamily: "Source Serif 4 Variable, Source Serif 4, Georgia, serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  lede:
    fontFamily: "Source Serif 4 Variable, Source Serif 4, Georgia, serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Source Serif 4 Variable, Source Serif 4, Georgia, serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.65
    fontVariation: "\"opsz\" 18"
  group-label:
    fontFamily: "Source Serif 4 Variable, Source Serif 4, Georgia, serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.3
  row:
    fontFamily: "Source Serif 4 Variable, Source Serif 4, Georgia, serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.4
  running-head:
    fontFamily: "Source Serif 4 Variable, Source Serif 4, Georgia, serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Libre Franklin Variable, Libre Franklin, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
  meta:
    fontFamily: "Libre Franklin Variable, Libre Franklin, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  slug:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.4
  key:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "11.5px"
    fontWeight: 400
    lineHeight: 1.35
rounded:
  kbd: "2px"
  tag: "2px"
  row: "3px"
  btn: "4px"
  input: "4px"
  panel: "6px"
spacing:
  sp-1: "2px"
  sp-2: "4px"
  sp-3: "6px"
  sp-4: "8px"
  sp-5: "12px"
  sp-6: "16px"
  sp-7: "24px"
  sp-8: "32px"
  topbar: "52px"
  proof-margin: "56px"
  column: "680px"
  column-wide: "820px"
  side-gap: "56px"
  side-margin: "200px"
components:
  button-primary:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.galley-white}"
    typography: "{typography.label}"
    rounded: "{rounded.btn}"
    padding: "6px 12px"
  button-primary-hover:
    backgroundColor: "{colors.pine-deep}"
    textColor: "{colors.galley-white}"
  button-primary-lg:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.galley-white}"
    rounded: "{rounded.btn}"
    padding: "8px 14px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.btn}"
    padding: "6px 12px"
  button-secondary-hover:
    backgroundColor: "{colors.desk}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.graphite}"
    rounded: "{rounded.btn}"
    padding: "6px 10px"
  button-ghost-hover:
    backgroundColor: "{colors.desk}"
    textColor: "{colors.ink}"
  button-destructive:
    backgroundColor: "{colors.red-pencil}"
    textColor: "{colors.galley-white}"
    rounded: "{rounded.btn}"
    padding: "6px 12px"
  icon-button:
    textColor: "{colors.graphite}"
    rounded: "{rounded.btn}"
    size: "30px"
  kbd:
    textColor: "{colors.graphite}"
    typography: "{typography.key}"
    rounded: "{rounded.kbd}"
    padding: "0 5px"
  pill-accent:
    backgroundColor: "{colors.pine-wash}"
    textColor: "{colors.pine-ink}"
    typography: "{typography.slug}"
    rounded: "{rounded.tag}"
    padding: "1px 6px"
  segment-tab:
    textColor: "{colors.graphite}"
    typography: "{typography.label}"
    padding: "4px 0"
  segment-tab-on:
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.galley-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "0 11px"
    height: "36px"
  input-sm:
    rounded: "{rounded.input}"
    padding: "0 10px"
    height: "32px"
  search-field:
    textColor: "{colors.graphite}"
    typography: "{typography.label}"
    rounded: "{rounded.input}"
    height: "32px"
    width: "360px"
  list-row:
    textColor: "{colors.ink}"
    typography: "{typography.row}"
    padding: "9px 0"
  menu:
    backgroundColor: "{colors.galley-white}"
    rounded: "{rounded.panel}"
    padding: "4px"
  menu-item:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.btn}"
    padding: "7px 10px"
  modal:
    backgroundColor: "{colors.galley-white}"
    rounded: "{rounded.panel}"
    width: "560px"
  query-card:
    backgroundColor: "{colors.galley-white}"
    rounded: "{rounded.panel}"
    padding: "12px 14px"
    width: "248px"
  note-page:
    backgroundColor: "{colors.galley-white}"
    width: "920px"
  info-map-slip:
    backgroundColor: "{colors.galley-white}"
    rounded: "{rounded.btn}"
    padding: "12px 14px"
  category-flag:
    rounded: "1px"
    width: "5px"
    height: "11px"
---

# Design System: Plotr

## Overview

**Creative North Star: "The Galley Proof"**

Plotr is a book in proof. Every screen is a galley page with a margin. The writer's words are the typeset text. Every tool is a proofreader's mark: a change bar, a number in the margin, a pencilled query, a typed slug line. The interface stays quiet so the story's own titles, loglines and moments are the first things the eye reads.

The page is white galley stock with ink type and hairline rules. One pine pencil marks what is selected, current, or about to act. Parts of a page are divided by space and rules, not by boxes. Density is that of a book's contents page: long lines of serif names, dot leaders, and typed details at the right edge. Dark mode is the negative of the same proof, not a separate theme.

The system rejects the centred dev-tool column with black pill buttons that it replaced ("Pine", Geist). It also rejects the cream-and-lamplight notebook. It must never read as project-management software, a database editor, or an IDE.

**Key Characteristics:**
- White galley stock, ink type, hairline rules, one pine accent.
- Three typefaces with fixed jobs: serif for words, Franklin for controls, Courier for numbers and keys.
- A proof margin on the left of every page carries numbers and change bars.
- Selection is a 2px change bar, not a filled box.
- Flat paper at rest; only things that float above the page cast a soft shadow.
- Small paper corners (2px to 6px).
- Dark mode is the film negative, with a lighter pine.

## Colors

A near-monochrome proof: ink and graphite on white stock, with one muted pine pencil.

### Primary
- **Pine Pencil** (#29524A): the one accent. It marks the primary action button, change bars on selected and focused rows, the active segment underline, focus rings, the Plot Line curve and its dots, the query card outline and leader line, links and wiki-links, and checked checkboxes.
- **Deep Pine** (#1D3C36): hover state of the primary button only.
- **Pine Wash** (#E4EDEA): the ground of accent pills, the active toolbar button, and the selected row in the Plot Line list panel.
- **Pine Ink** (#1E3B38): text on Pine Wash.

### Neutral
- **Galley White** (#FFFFFF): page stock and every raised surface (menus, modals, cards, sheets).
- **Proof Band** (#F7F7F5): alternating section bands on the Plot Line.
- **Desk** (#F3F3F0): the table under the paper. It fills the Notes folder tree, board preview thumbnails, and every hover wash in light mode.
- **Ink** (#141414): all primary type.
- **Graphite** (#5F5F66): secondary text, slug lines, numbers, icons at rest, placeholders.
- **Faint Graphite** (#A3A3A8): separators and marks only (breadcrumb slashes, checkbox outlines, preview strokes). It is not a text colour.
- **Hairline** (#E4E4E0): rules between groups and rows, the running-head underline, the ring on floating objects.
- **Strong Hairline** (#CFCFCA): outlines of secondary buttons, inputs, keys, Plot Line axes and section boundaries; the graphite change bar on row hover.
- **Leader** (#BDBDB8): the dots of dot leaders.
- **Red Pencil** (#B3372C): destructive buttons, danger menu items, errors, and the pending-save mark. Nothing else.

### The Negative (dark mode)
- **Film Black** (#111214) page, **Film Band** (#151619) bands, **Film Surface** (#17181B) raised surfaces, **Film Desk** (#0C0D0E) desk and text on pine.
- **Negative Type** (#ECEBE6), **Negative Graphite** (#A2A2A8), **Negative Faint** (#56585E).
- **Negative Hairline** (#25272B), **Negative Strong Hairline** (#34363B), **Negative Leader** (#3E4045), **Film Hover** (#1C1E21).
- **Negative Pine** (#72B0A1) with hover (#8CC3B5), wash (#1A2A26) and ink (#A9D3C8). **Red Pencil Negative** (#C04A3E).

### Category flags (user data)
- **Character** (#7C5CBF), **Location** (#3F9A5A), **Conflict** (#C8503F), **Lore** (#3B7DD8): presets for user categories. Users can pick any colour.

### Named Rules
**The Pine Pencil Rule.** Pine means selected, current, act, or link. Nothing decorative is pine. One primary (pine) button per screen, and it carries its single-key shortcut.

**The Flag Rule.** Category colours appear only as small flags (5×11px tabs) and 24px swatches beside a typed name. They never fill a card, a row, or a background.

**The Negative Rule.** Dark mode re-inks the same proof. Every role keeps its job; pine lightens to hold contrast, and text on pine turns to Film Desk.

## Typography

**Display Font:** Source Serif 4 Variable (with Georgia, serif), optical size axis in use
**Body Font:** Source Serif 4 Variable for all content; Libre Franklin Variable (with system-ui) for controls
**Label/Mono Font:** Courier Prime (with Courier New, monospace)

**Character:** The serif is the book: titles, names, loglines and prose are all set in it. Franklin is the quiet hand that labels controls. Courier Prime is the typewriter that writes slug lines, numbers, dates and keys, as on a manuscript.

### Hierarchy
- **Display** (600, 44px, 1.05, -0.02em, opsz 60): project and page titles. Settings pages use 34px.
- **Headline** (600, 34px, 1.15, opsz 48): the note title on the note page.
- **Board title** (600, 28px, 1, opsz 40): board names over canvases and the Notes list.
- **Title** (600, 22px): modal titles. Empty-state titles use 19px 600.
- **Lede** (italic 400, 19px, 1.45, max 56ch): the project logline under the display title.
- **Body** (400, 18px, 1.65, max 66ch, opsz 18): note prose. In-prose headings are 26 / 21 / 18px italic.
- **Group label** (600, 17px): serif heads of galley groups, on a hairline rule.
- **Row** (500, 16px): names in galley lists. Italic 14px serif under it for sub-lines; 14–15.5px serif for previews and results.
- **Running head** (400, 15px; current item 600): the breadcrumb.
- **Label** (Franklin 500, 13px): buttons, tabs, menus, field labels. Ghost buttons use 450.
- **Meta** (Franklin 400, 12px): field hints, group labels in the palette, margin-note labels.
- **Slug** (Courier Prime 400, 12.5px): slug lines, row numbers, dates, counts, zoom value, save status.
- **Key** (Courier Prime 400, 11.5px): keyboard keys.

### Named Rules
**The Three Hands Rule.** Words the writer wrote are serif. Controls are Franklin. Numbers, dates, keys and slug lines are Courier Prime. Do not cross the hands.

**The Sentence Case Rule.** Every label is sentence case with normal tracking. There are no uppercase or letter-spaced labels anywhere in the build.

## Layout

Every page uses one frame: a 56px proof margin, a 680px galley column (820px on wide pages), a 56px gap, and a 200px right margin for filters and margin notes. Pages without margin notes keep the space, so the column starts at the same x on every screen. The frame is left-weighted, centred as a whole on wide windows. Page padding is 48px top and 96px bottom, with 32px between blocks.

The top bar is a 52px running head: logo and breadcrumb left, search field centre, save status and screen actions right. Canvas boards (Plot Line, Info Map) fill the window under it, with the board title top-left, tool rails left, and a zoom control bottom-right. The Notes board is a 240px desk-toned folder tree beside a numbered galley list (max 820px). The note page is a full-height sheet from the right, up to 920px wide, with a 66ch column and a 200px margin.

Spacing follows a 2 / 4 / 6 / 8 / 12 / 16 / 24 / 32px scale. Rows take 7–12px of vertical padding. Board groups sit 36px apart.

Responsive steps (desktop windows from about 860px): at 1100px the save label hides and the note page margin drops under the text; at 1060px the right margin moves under the title and its filter becomes a horizontal list with the change bar underneath; at 1000px the search field collapses to its icon; at 960px the Notes folder tree narrows to 200px.

### Named Rules
**The Fixed Column Rule.** The galley column starts at the same x on every page. Numbers and marks live in the proof margin, left of that line, never inside the column.

## Elevation & Depth

Paper on a desk. Surfaces are flat at rest and separated by hairlines and space. A hairline ring (`0 0 0 1px`) replaces borders on raised objects. Only objects that float above the page cast a shadow, and every shadow is soft with a negative spread, so it reads as lift, not as a box outline. Dark mode deepens the same shadows with black.

### Shadow Vocabulary
- **Popover** (`0 0 0 1px hairline, 0 12px 28px -14px rgba(20,20,20,0.28)`): menus, category picker, wiki-link menu, Plot Line list panel.
- **Rail** (`0 0 0 1px hairline, 0 8px 22px -14px rgba(20,20,20,0.25)`): Info Map tool rail, zoom control.
- **Modal** (`0 0 0 1px hairline, 0 30px 70px -30px rgba(20,20,20,0.45)`): modals and the search palette, over a 22% ink backdrop.
- **Sheet** (`-1px 0 0 hairline, -24px 0 60px -30px rgba(20,20,20,0.35)`): the note page's left edge.
- **Card** (`0 10px 22px -14px rgba(20,20,20,0.35)`; black at 70% in the negative): the lift under Info Map slips, Plot Line cards and the query card, always paired with their hairline or pine ring.
- **Selected** (`0 0 0 2px pine, 0 8px 22px -14px rgba(41,82,74,0.45)`): a selected Info Map slip or image.
- **Focus** (`2px solid pine outline, 2px offset`; inputs use an inset 2px pine ring).

### Named Rules
**The Paper on Desk Rule.** Flat at rest. A shadow means the object floats above the page. No hard offset shadows.

## Shapes

Paper has corners. Radii are small and fixed: 2px for keys, tags and pills; 3px for rows; 4px for buttons, inputs, slips and preview thumbnails; 6px for menus and every other popover (category picker, wiki-link menu), modals, rails and the query card. Only dots are round (moment dots, status dots, handles). Category flags are 5×11px tabs with 1px corners; on Info Map slips they hang from the top edge like index tabs. Project covers are small book spines (30×42px, square spine edge, 3px fore-edge corners). Dashed lines mark boundaries that the writer can move: Plot Line section edges and Info Map groups.

### Named Rules
**The Paper Corners Rule.** Nothing is rounder than 6px except a dot. There are no capsule buttons or capsule pills.

## Components

### Buttons
Quiet, typed controls; only the primary button has a fill.
- **Shape:** paper corner (4px).
- **Primary:** pine fill, white Franklin 500 13px, 6px 12px padding (large: 13.5px, 8px 14px). It carries a Courier key hint in a faint outlined key. Hover: Deep Pine.
- **Secondary:** transparent with a Strong Hairline inset outline, ink text. Hover: desk wash.
- **Restore (accent outline):** outline at rest, fills pine on hover.
- **Empty trash (ink outline):** outline at rest, turns red pencil (text and outline) on hover.
- **Ghost:** graphite text, no outline, 6px 10px. Hover or on: desk wash and ink text.
- **Destructive:** red pencil fill, white text, brightens on hover.
- **Text action:** graphite Franklin text (for example "+ Add", "+ New folder"); turns pine on hover.
- **Icon button:** 30px square, graphite icon; desk wash on hover.
- **Transitions:** 140ms on the single ease-out curve. Disabled is 45% opacity.

### Keys
- Courier Prime 11.5px in a 2px-corner key with a Strong Hairline inset outline, graphite text. Inside the primary button the outline is white at 35%.

### Pills and Tags
- **Pills** are typed labels, not capsules: Courier 12.5px, 2px corners, 1px 6px padding. Accent pill: Pine Wash ground, Pine Ink text. Ring pill: Strong Hairline outline, graphite text.
- **Tags** are plain Franklin 12px graphite text.

### Segmented Tabs
- Franklin 500 13px words, 12px apart, no container. The active tab is ink with a 2px pine underline; others are graphite and darken on hover. Counts sit beside the word in Courier.

### Galley Lists (signature)
Rows are lines of type, not boxes.
- **Group:** serif 600 17px head on a hairline rule, tools right in Franklin graphite.
- **Row:** 9px vertical padding, serif 500 16px name. A Courier number sits right-aligned in the proof margin (56px left of the column). Italic serif sub-line; Courier details at the right edge.
- **Dot leaders:** a row of 1px Leader dots every 6px runs from the name to the right-edge details.
- **Change bar:** a 2px bar 22px left of the row. Strong Hairline on hover; pine on selection and keyboard focus, and the name turns pine on focus.
- **Hover-only tools** fade in on hover or focus-within.
- Variants: dashboard contents lines (preview thumbnail, name, leaders, type and count, date), Notes rows (600 name, two-line serif preview, category flags right, hairline under each), Trash rows, Start rows (book-spine cover in the margin), search results.

### Margin Filter
- A typed serif 15px list in the right margin with Courier counts. The chosen line is ink 600 with a pine change bar 14px to its left. Under 1060px it becomes a horizontal list and the bar moves underneath.

### Inputs / Fields
- **Style:** Galley White ground, Strong Hairline inset outline, 4px corners, 36px tall (small 32px), 14px text. Labels Franklin 500 13px above; hints 12.5px graphite below.
- **Focus:** the outline becomes a 2px inset pine ring (160ms).
- **Path field:** Courier 12.5px text beside a Browse button.

### Navigation
- **Running head:** the breadcrumb in serif 15px; ancestors graphite (pine on hover), current item ink 600, Faint Graphite slashes. It truncates each crumb (220px, current 280px).
- **Search field:** a 32px outlined field in the centre of the top bar with graphite placeholder and Ctrl K keys. It opens the search palette.
- **Search palette:** 640px modal-shadowed sheet 96px from the top, with a serif 19px input (italic placeholder), grouped result rows, and a foot line of key hints. The active result gets a desk wash and a 2px inset pine bar on its left.
- **Menus:** 6px panel with Popover shadow, 4px padding, 7px 10px Franklin items. Keyboard focus adds a 2px inset pine bar on the left; danger items are red pencil.

### Modal
- Galley White, 6px corners, Modal shadow, 560px wide. Serif 600 22px title, 24px side padding, right-aligned footer buttons. Confirm messages are serif 15.5px graphite. Focus is trapped inside and returns to the opener on close. It enters with a 4px rise over 360ms.

### Plot Line (signature)
- A white canvas with Proof Band section bands, dashed Strong Hairline section edges, and italic serif section names. Axes are Strong Hairline; axis labels are Courier 12px graphite.
- The story curve is a 1.75px pine line. Moments are pine dots on a paper ring with a pine halo on hover.
- **Titles mode:** Courier number plus serif 14px title beside each dot; pine on hover.
- **Cards mode:** 70px-tall white slips with a hairline ring and 4px corners, 600 title and a two-line preview.
- **Query card:** the selected moment's card hangs from its dot on a 1.25px pine leader line, like an author's query. 248px wide, 6px corners, a 1px pine outline and soft lift. Courier location line, serif 600 17px title, three-line serif preview, and a pine "Open note" action with its Enter key. Arrow keys step moment to moment.

### Info Map (paste-up board)
- A white board with a faint pine grid (24px minor, 120px major lines).
- **Slips:** white note cards with a Strong Hairline ring and a small lift, 4px corners, serif 600 16px title and serif preview. Category flags hang from the top edge. Selected: the Selected shadow.
- **Groups:** dashed Faint Graphite keylines with italic serif names above them.
- **Links:** graphite 1.25px pencil lines; selected links are 2px pine. Labels are italic serif on a paper patch.
- **Handles:** 9px pine dots, shown on hover and selection.
- **Tool rail:** a vertical panel on the left edge; the active tool is a pine fill.

### Note Page (signature)
- A full-height galley sheet that slides in once from the right (48px, 360ms, exponential ease-out; off under reduced motion) over a 22% backdrop. A 46px tool bar with a hairline under it, then a 66ch serif column and a 200px margin of notes: categories as flags, "Appears in" as underlined serif links, and Courier dates.
- Prose follows the Body role. Links and wiki-links are pine (wiki-links with a dotted pine underline). Checked tasks are pine boxes with a line-through in graphite.
- The rich-text toolbar uses 30×28px buttons; the active one is Pine Wash with Pine Ink.

### Category Flags
- A 5×11px coloured tab beside Franklin 12px graphite text. The picker is a Popover with a pine check on chosen rows. Swatches are 24px squares with 2px corners; the active swatch gets a pine ring on a paper gap.

## Do's and Don'ts

### Do:
- **Do** keep pine for selected, current, act and link, and give each screen one pine primary button with its shortcut key.
- **Do** mark selection and focus with a 2px change bar in the margin: Strong Hairline on hover, pine when selected or focused.
- **Do** set the writer's content in Source Serif 4, controls in Libre Franklin, and numbers, dates, keys and slug lines in Courier Prime.
- **Do** start the galley column at the same x on every page and put numbers in the 56px proof margin.
- **Do** divide page parts with space and hairline rules (#E4E4E0), with serif group heads on the rule.
- **Do** use dot leaders between a row name and its right-edge details.
- **Do** keep every corner at 6px or less, and use hairline rings instead of borders on raised objects.
- **Do** give every new colour role a dark (negative) value in the same token set.
- **Do** use the one ease-out curve (cubic-bezier(0.16, 1, 0.3, 1)) at 140ms for hover, 160ms for focus, and 360ms for entrances, and respect reduced motion.

### Don't:
- **Don't** box galley list rows or page sections into cards. Cards exist only as objects on a canvas: Info Map slips, Plot Line cards, and the query card.
- **Don't** use category colours as fills, washes or large backgrounds; they are flags only.
- **Don't** use capsule shapes, black pill buttons, or a centred dev-tool column (the replaced "Pine" look).
- **Don't** use cream paper, lamplight warmth, or a notebook texture.
- **Don't** use uppercase or letter-spaced labels, or small labels above headings.
- **Don't** use hard offset shadows or shadows on objects that rest on the page.
- **Don't** use Faint Graphite (#A3A3A8) for readable text.
- **Don't** add a second accent colour; red pencil is for danger only.
