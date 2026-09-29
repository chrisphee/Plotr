# Handoff: Plotr "Pine" UI redesign

## Overview
A full visual and layout refresh of Plotr (repo `chrisphee/Plotr`, Tauri 2 + React 19). Core features and data model are unchanged. What changes:

- **Palette** goes from "ink & paper" monochrome to three colours: white `#FFFFFF`, black `#06070E`, pine teal `#29524A`.
- **Type** becomes Geist (UI + titles) and Geist Mono (meta, timestamps, kbd hints). Bricolage Grotesque and Figtree are dropped.
- **Shell:** the 320px ink **Spine** (`components/shell/shell.css .spine`) and the floating bottom **Dock** (`Dock.tsx`) are replaced by one **TopBar** on every screen.
- **Dashboard and Start** switch from tile shelves / cover grids to a **centred 720px column of list rows**.

## About the design files
The files in this bundle are **design references built in HTML**. They are prototypes showing the intended look and behaviour, not production code to copy. The task is to **recreate these designs in the existing Plotr codebase**, using its React components, CSS files and stores. Keep the current architecture (`navStore`, `projectStore`, feature folders) and restyle or restructure components as described below.

## Fidelity
**High fidelity.** Colours, type, spacing, radii and shadows are final. All screens are drawn at 1280×800. Match them closely; the layout must still reflow for smaller windows (the centred column has a max width, and nothing else is fixed-width).

## Files in this bundle
- `Plotr 4g Screens.dc.html`: all nine screens (open in a browser, keeping `support.js` beside it). Labels 1a–1i match the sections below.
- `Plotr UI Directions.dc.html`: the exploration history (4g is the chosen scheme).
- `tokens.pine.css`: **drop-in replacement for `src/styles/tokens.css`**. Existing variable names are kept, new ones are marked `NEW`. Start the implementation here.
- `support.js`: runtime needed only to view the HTML files.

---

## Global: TopBar (new component, replaces Spine + Dock)
`src/components/shell/TopBar.tsx`, rendered at the top of every screen.

- Height 56px, `border-bottom: 1px solid #E4E4E6`, background `#FFFFFF`, padding 0 20px.
- CSS grid `1fr auto 1fr`, items centred.
- **Left: logo and breadcrumb.** 22×22 tile, radius 6, `#06070E`, with a 6px dot in `#5E9A8C` centred. Then the breadcrumb (reuse `Breadcrumb.tsx` logic): 13px, ancestors `#64656B`, `/` separators `#B5B6BA`, current item `#06070E` weight 500, gap 10px. On Start, show only "Plotr" (500).
- **Centre: command field.** 380×34, radius 9, `box-shadow: 0 0 0 1px #E4E4E6`, 13px `#64656B`. Placeholder: "Search notes, boards, or run a command" ("Search projects" on Start). Right side shows kbd keys `Ctrl` `K` (Geist Mono 500 11px, padding 2px 5px, radius 4, bg `#F4F4F5`). Clicking the field, or pressing Ctrl+K, opens the SearchOverlay. **Keep Ctrl+Shift+F** as an alias.
- **Right: contextual actions** (these replace `Dock` `actions`). Ghost buttons: 13px `#64656B`, padding 6px 10px, radius 7, hover bg `#F4F4F5` and text `#06070E`. There is at most one primary button: bg `#06070E`, text `#FFFFFF`, 500, padding 7px 8px 7px 12px, radius 8, hover bg `#29524A` (180ms). It carries a trailing kbd hint (Geist Mono 10.5px, bg `rgba(255,255,255,.16)`, radius 4).

Per-screen actions:
| Screen | Ghost | Primary |
|---|---|---|
| Start | Connectors, App settings | — |
| Dashboard / Folder | Trash, Settings | New board `N` |
| Plot Line | Sections, List (toggle; active = bg `#F4F4F5`) | Add moment `N` |
| Info Map | Fit to screen | — |
| Notes board | — | New note `N` |
| Trash | — | Outline "Empty trash" (ring `#E4E4E6`, hover bg `#06070E` text white), opens the existing ConfirmDialog |
| Project settings | — | Status: 6px teal dot + "Saved" (12.5px muted) |

"Close project" moves to the breadcrumb: clicking "Projects" closes the project, which is the existing behaviour.

## Shared: list row (used on Start, Dashboard, Notes, Trash)
- Padding 10–12px, radius 10, no border at rest.
- Hover: bg `#FFFFFF` and `box-shadow: 0 0 0 1px #E4E4E6, 0 6px 20px -10px rgba(6,7,14,.22)`, 180ms `--ease`.
- Rows in a group stack with a 2–4px gap.
- Group label above: 12px 500 `#64656B`, padding 0 12px 6px, optional right-aligned "+ Add" that turns teal on hover.

---

## 1a Start (`features/start/StartScreen.tsx`, `start.css`)
- Remove the spine. The TopBar sits above a centred 720px column with padding-top 72px and gap 36px.
- **Header, centred:** "Your projects" (Geist 600 48px, lh 1.05, -0.035em). Below it, the existing tagline "A quiet workspace for stories — plot lines, maps of ideas, and every note in its place." (15px, lh 1.5, `#64656B`, max-width 440).
- **Buttons:** 8px gap, 13.5px 500.
  - "New project" is primary, with kbd `N`.
  - "Open project…" and "Import backup…" are outline buttons (ring `#E4E4E6`, padding 9px 14px, radius 8, hover bg `#F4F4F5`).
- **List:** group label "Recent" on the left and "Last opened" on the right.
  - Row grid `40px 1fr auto`, gap 18.
  - **Cover:** 40×54, radius 4. Background is `project.color`, or `#29524A` by default. A 14×1.5px rule sits bottom-left in white at 70% (use `readableTextOn`).
  - **Name:** 15px 500.
  - **Path:** Geist Mono 11.5 `#64656B`, ellipsis.
  - **Last-opened time:** Geist Mono 11.5 muted.
  - "Remove from recents" × appears on row hover (existing ConfirmDialog).
- **Empty state:** keep the existing copy, centred in the column.

## 1b Dashboard (`features/dashboard/DashboardScreen.tsx`, `Shelves.tsx`, `dashboard.css`)
Centred 720 column, padding-top 52, gap 28.

- **Status chips:** centred, gap 6, 12px 500, pills (radius 999, padding 3px 10px).
  - `meta.status` uses bg `#DFE6E4` and text `#1E3B38`.
  - `meta.genre` uses ring `#E4E4E6` and text `#64656B`.
- **Title:** `meta.name` in Geist 600 48px, -0.035em, centred.
- **Meta line:** 12.5px muted. A 6px teal dot, then "Autosaved · {n} boards · edited {relative}". When autosave is off and edits are pending, show "Unsaved changes" instead; this replaces `UnsavedPill`.
- **Type filter (new, local state):** a segmented control (reuse it for Read/Edit and similar toggles).
  - Track: bg `#F4F4F5`, padding 3, radius 10, 12.5px 500.
  - Segments: All / Plot Line / Info Map / Notes, each with a Geist Mono 11px count at 60% opacity. Padding 5px 12px, radius 7.
  - Selected segment: bg `#FFFFFF`, `box-shadow: 0 1px 2px rgba(6,7,14,.12), 0 0 0 1px #E4E4E6`, text `#06070E`. Others: text `#64656B`.
  - Folders with no matching boards are hidden.
- **Folders** (replace `Shelves`): one group per top-level folder (group label = folder name), plus a "Boards" group for loose boards. Group gap 22.
- **Board row:** grid `72px 1fr auto 76px`, gap 20.
  1. **Preview**, 72×36, radius 7, bg `#F4F4F5`, a small live render of the board's data:
     - Plot Line: a polyline through `points` (x → width, y → height inverted), stroke `#29524A` 1.6px, inset 8/7px.
     - Info Map: 5px `#06070E` dots at scaled `items` positions.
     - Notes: three 2px bars in `#B5B6BA` at 82 / 64 / 72% width.
  2. **Name:** 15px 500.
  3. **Type tag:** "{Type} · {count}", 12px, padding 2px 8px, radius 6, bg `#F4F4F5`, `#64656B`.
  4. **Edited:** Geist Mono 11.5 muted, right-aligned (short relative format: "2h ago", "Yesterday", "Mon", "12 Sep"). Board `modifiedAt` isn't in `TreeBoard` today; add it, or derive it from the board file's mtime.
- **Right-click menu:** unchanged (Open / Rename / Move to Trash).
- **Subfolders** show as rows with a folder preview (use the Notes bar style) that navigate to FolderScreen. FolderScreen uses the same layout, with the folder name as the title.

## 1c Plot Line (`features/plotline/*`)
- The canvas fills the area below the TopBar, on a white background.
- **Board title:** top-left at 32/28: Geist 600 28px, -0.03em, with "{n} moments · {n} sections" 12px muted below.
- **Sections:** full-height bands with no fill on the first section, alternating `#FAFAFA` / `#FFFFFF` after that. Boundaries are `1px dashed #D6D6D9`. Section title "Act I · The Silence" sits at the top of each band (12px 500 `#64656B`, 16px inset).
- **Axes:**
  - Baseline: 1px `#D6D6D9`, 64px above the bottom.
  - Axis labels: Geist Mono 11px muted. "BEGINNING" bottom-left, "END →" bottom-right, "HIGH" / "LOW" on the left edge.
- **Curve:** a polyline through all points in story order, stroke `#29524A` 2px, round joins.
- **Moments:**
  - 12px dots, fill `#29524A`, white 2px ring. 24px hit target; hover halo `rgba(41,82,74,.12)`.
  - **Selected:** fill `#06070E` plus an outer 4px `#06070E` ring (outside the white ring).
- **Moment card** (`.pl-card`): opens beside the selected dot, 18px right and 14px below, flipping left or up at the edges.
  - Box: 240px wide, padding 12px 14px, radius 10, `--shadow-pop`.
  - Top line: Geist Mono 11 muted, section on the left ("ACT II") and position on the right ("6 / 11").
  - Title 14.5px 600, preview 12.5px lh 1.5 muted, then "Open note ↵" in 12px 500 teal.
  - Enter or click opens the NotePopup.
- **List panel:** same data as today, restyled with rows at radius 8, hover `#F4F4F5` and `--shadow-pop` on the panel.

## 1d Info Map (`features/infomap/*`)
- **Canvas:** white with a dot grid (`radial-gradient(#DADADD 1px, transparent 1px)` at 22px, offset 11px). Board title placement matches Plot Line.
- **Tool rail:** left 24, vertically centred.
  - Container: bg white, padding 5, radius 12, `0 0 0 1px #E4E4E6, 0 8px 24px -12px rgba(6,7,14,.2)`.
  - Items (text labels, 13px muted, padding 7px 12px, radius 8), in order: Select, Note, Image, Text, Group, then a separator (1px `#E4E4E6`, margin 3px 8px), then Line, Arrow.
  - Active item: bg `#06070E`, white text.
- **Note node:**
  - Box: bg white, radius 8, ring `#E4E4E6`, padding 14px 16px.
  - Title 15px 600, preview 12.5px lh 1.5 muted.
  - Category tint stays as today (`--cat-tint`).
- **Selected node:**
  - `box-shadow: 0 0 0 2px #29524A, 0 8px 24px -12px rgba(41,82,74,.4)`.
  - Handles: 9px teal circles with a 2px white ring.
  - Resize handle: 9px white square, radius 2, 1.5px teal ring.
- **Group:** 1.5px `#D6D6D9` border, radius 10, bg `rgba(6,7,14,.015)`. Title sits above the frame, 13px 500 muted.
- **Edges:**
  - Stroke `#64656B` 1.5px; arrow heads in the same colour.
  - Labels 12px 500 muted on a white pill (padding 1px 7px, radius 4).
  - Selected edge: `#06070E` 2px.
- **Text node:** Geist 500 20px, -0.01em.
- **Image node:** radius 8, ring `#E4E4E6`.
- **Zoom control (new):** bottom-right 24px, a pill with −, "100%" (Geist Mono 11.5) and +, each 28px, radius 7, hover `#F4F4F5`. Wire it to React Flow's zoom.

## 1e Notes board (`features/notes-board/*`)
- **Layout:** grid `248px 1fr` below the TopBar. Tree pane has a right border of 1px `#E4E4E6`, padding 24px 12px.
- **Tree:**
  - Board name 17px 600 -0.02em.
  - Items 13.5px muted, padding 7px 10px, radius 8, count on the right in Geist Mono 11.5. Hover bg `#F4F4F5`.
  - **Active folder:** bg `#F4F4F5`, text `#06070E` 500, `box-shadow: inset 2px 0 0 #29524A`, count in teal.
  - "All notes" and "Pinned" come first, then a 1px separator, then folders. Nested folders are indented 16px.
  - "+ New folder" 13px muted, hover teal.
- **List pane:** padding 28px 48px.
  - **Header:** folder name (Geist 600 28px), a 220×32 filter input (radius 8, ring), and a sort button ("Manual order ▾", outline).
  - **Rows:** use the shared list row style. Grid `1fr auto`.
    - Left: title 15px 500, plus a "Pinned" pill (11px 500, bg `#DFE6E4`, text `#1E3B38`) when pinned, and a 2-line clamped preview (13px lh 1.5 muted).
    - Right, stacked: date (Geist Mono 11.5), then a 7px category dot with the category name (12px muted).
  - Drag-and-drop and context menus are unchanged.

## 1f Note popup (`features/note-editor/NotePopup.tsx`, `notePopup.css`)
- **Backdrop:** `rgba(6,7,14,.32)` with `backdrop-filter: blur(2px)`.
- **Dialog:** 720×640 (max-height 85vh), radius 14, `--shadow-modal`, flex column.
- **Bar:** padding 14px 16px 0 20px.
  - Read/Edit segmented control (the Dashboard style; segments padding 5px 14px, radius 6).
  - "Linked · {n} places" badge (12px 500 pill, `#DFE6E4` / `#1E3B38`), shown only when refcount > 1.
  - Close × on the right (30px, radius 7, hover `#F4F4F5`).
- **Body:** padding 22px 40px 0, gap 14.
  - Title: Geist 600 30px, lh 1.1, -0.03em.
  - **Category chips:** pill with a 7px dot and name, 12px 500, ring `#E4E4E6`, muted text.
  - **Edit mode:**
    - "+ Category" pill with a 1px dashed `#D6D6D9` border, turning teal on hover.
    - **Toolbar:** radius 9, ring, padding 4, 13px muted buttons, 28px tall. Groups: B / I, then H1 / H2, then List / Checklist / Quote, then Link / Image. Groups are separated by 1px × 16px `#E4E4E6`.
    - The editor area gets a 1px ring and padding 10px 12px.
  - **Editor content:**
    - Body 15px lh 1.7, max-width 600.
    - `[[wiki-links]]` in teal with a 1px teal underline.
    - **Checklist:** 15px boxes, radius 4. Checked boxes are filled teal with a white check, and their text is muted with a strike-through.
  - **Attachment:** row with a 36px thumbnail, file name 13px 500, size in Geist Mono 11. Ring, radius 9, max-width 340.
- **Footer:** border-top `#E4E4E6`, padding 14px 40px, Geist Mono 11.5 muted. "Created {date}" on the left, "Edited {date, time}" on the right.

## 1g Search overlay (`features/search/SearchOverlay.tsx`, `search.css`)
- **Trigger:** Ctrl+K, Ctrl+Shift+F, or clicking the TopBar field. Backdrop `rgba(6,7,14,.28)`.
- **Panel:** 640px wide, top 96px, radius 14, `--shadow-modal`.
- **Input row:** 56px tall, bottom border. Search glyph (12px circle, 2px `#64656B`), input 16px, "Esc" kbd on the right.
- **Results:** padding 8, grouped by kind.
  - **Group heads:** "Notes", "Boards", "Folders" (11.5px 500 muted, padding 10px 12px 4px).
  - **Row:** grid `28px 1fr auto`, padding 8px 12px, radius 9.
    - 28px icon tile (radius 7, bg `#F4F4F5`), title 14px 500, location 12px muted.
  - **Active row:** bg `#F4F4F5`, `inset 2px 0 0 #29524A`, icon tile filled teal with a white glyph, and "↵" on the right. ↑/↓ move the active row.
  - Category dots are unchanged.
- **Footer:** "See all results" (12px 500 teal) on the left, "↑↓ to move · Enter to open" (12px muted) on the right.
- **Empty result:** `Nothing found for “{q}”.`, centred and muted.
- SearchResultsScreen uses the same row style inside the 720 column.

## 1h Trash (`features/trash/*`)
- **Header:** centred 720 column, padding-top 52. Title "Trash" (48px), subtitle using the existing empty-state copy (13px muted).
- **Rows:** shared list row style, grid `1fr auto auto`.
  - Name 15px 500; "{originPath joined by ›} · deleted {date}" 12.5px muted.
  - "Restore" outline button (ring, padding 6px 12px, radius 7, 13px 500; hover fills teal with white text).
  - × to delete permanently (existing ConfirmDialog).

## 1i Project settings (`features/project-settings/*`)
- **Layout:** 960 column, padding-top 48. Title "Project settings" (Geist 600 36px, -0.035em). Below it, a 2-column grid (gap 56).
- **Left column:** Name, Description, then Genre and Status side by side, then Export.
  - Labels 13px 500, gap 7.
  - Inputs: 38px tall, radius 8, ring `#E4E4E6`. Focus: `0 0 0 2px #29524A`. Textarea 96px tall.
  - **Export:** the existing hint copy (12.5px muted), plus two outline buttons: "Export backup (.zip)" and "Export as Markdown".
- **Right column:** Cover & colour, then Categories.
  - **Cover & colour:** 84×120 cover preview (radius 6). Three 24px colour swatches (radius 6): black, teal, white. The selected swatch gets `0 0 0 2px #fff, 0 0 0 4px #29524A`. Below that, "Choose image…" (outline) and "From Pinterest" when that connector is connected.
  - **Categories:** each row is a grid `24px 1fr 30px`: an 18px swatch (radius 5), a 34px input, and ×. "+ Add category" is 13px 500 teal text.

---

## Interactions & motion
- A single curve everywhere: `cubic-bezier(.2,.7,.2,1)`. Hover 180ms. Popups enter at 320ms, scaling from 0.965 and fading. Exits take 160ms and only fade. Sheets and panels rise 10px on enter. These are the existing keyframes in `base.css`; keep them.
- **Rows** change background and shadow on hover. They no longer lift with `translateY`.
- **Primary buttons** go from black to teal on hover.
- **Focus-visible:** `box-shadow: 0 0 0 2px #29524A` on inputs; `outline: 2px solid #29524A; outline-offset: 2px` elsewhere.
- **New keyboard hints** (shown in the UI, so they must work): `N` = new board / note / moment in the current context; Ctrl+K = search; Enter opens the selected moment card or search result; Esc closes popups.

## State
- `DashboardScreen`: `typeFilter: 'all' | 'plotline' | 'infomap' | 'notes'` (local).
- `PlotLineScreen`: selected point already exists; the card placement flips at the edges.
- `SearchOverlay`: `activeIndex` already exists; add grouping by `result.kind`.
- `TreeBoard` or the board file needs `modifiedAt` for the "edited" column (see 1b).

## Assets
- Fonts: Geist and Geist Mono (Google Fonts, or `@fontsource/geist` and `@fontsource/geist-mono` to stay offline, which is preferred for Tauri).
- Icons: the designs use text labels in the TopBar, tool rail and toolbar. Where the codebase keeps `lucide-react` icons (Trash, Settings, B/I…), use them at 15px with stroke 1.75 in `currentColor`.
- Logo: the 22px black tile with the `#5E9A8C` dot is a placeholder for the Quill mark (`src-tauri/icons/icon.svg`). Use the real mark at that size if it reads well.
- The image placeholders in 1d and 1f stand in for user images.

## Not designed yet
App Settings, Connectors / Pinterest picker, CreateProjectModal, CreateBoardModal, Rename and Confirm dialogs, Menu. Restyle these with the same tokens: modals follow the Note popup shell, and menus use `--shadow-pop`, radius 10, and 8px-radius rows with `#F4F4F5` hover.
