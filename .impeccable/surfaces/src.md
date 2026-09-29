---
version: 1
slug: "src"
primary_target: "src"
related_targets: []
---

# Plotr app UI

Scope: the whole desktop app UI (Start, sidebar shell, Home, Folder, Plot Line, Info Map, Notes board, note sheet, Search, Trash, settings, modals). Mode: Operate. Replaces "The Galley Proof" (commit c7e473f), which the user rejected; keeps its keyboard, focus, Plot Line label and note-page function.

Audience and job: the author alone, long evening sessions over months, planning novels, games, scripts and worlds. Find a board, read the story's shape, capture and edit notes.

User answers (2026-09-29): references Craft and Apple's own apps; left sidebar navigation; keep Galley Proof function, replace the look. "Don't be afraid to change the layout."

Unresolved: none blocking.

## Direction contract

THESIS: Plotr is a modern Mac-class desktop app in the Craft / Apple Notes / Freeform family: a calm sidebar holds the project, the content area is a soft, rounded, layered workspace, boards are cards, and notes open as floating documents. It refuses the editorial book costume (Galley Proof) and the generic dev-tool column (Pine).

OWN-WORLD: White content (#FFFFFF) beside a cool grey sidebar (#F5F5F7); ink #1D1D1F, secondary #6E6E73; hairlines at 8-12% black. One accent, a modern pine (#227A66), user-switchable in App settings (Pine, Blue, Violet, Rose, Orange, Graphite). Inter Variable with optical sizes for everything. Radii 8 / 12 / 16px, capsule chips and segmented tracks, layered soft shadows, blurred material on menus, floating toolbars and the note sheet backdrop. Dark mode: #1B1B1D content, #222225 sidebar, lighter accent for text.

STORY: The writer sees the project tree at all times, lands on a Home page of board cards with live previews, opens any board or note in one click, and never loses place.

FIRST VIEWPORT: Home at 1280x800: 248px sidebar (project switcher, Search Ctrl K, Home, Boards tree with folders and type icons, Trash and settings at the foot); 52px header with the path and a pine "New board" button; content column (max 1040px): a 64px cover tile beside the 30px bold project name, description and one meta line; a "Recently edited" row; then board cards (live preview on top, name and type below) grouped by folder, with a sliding segmented filter.

FORM: Canon (the standing exit), taken by the user's own words, executed at the craft bar of Craft and Apple's apps; follows direction round seed key 724ef032. Signature interaction: the smooth plot curve (monotone spline with a soft area fill) and a sliding segmented thumb; notes rise as a centred document sheet over a blurred board. Motion grammar: 150-200ms eases for state, 320ms spring-like rise for sheets, a crossfade between screens, all off under reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
