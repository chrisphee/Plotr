# Plotr — Implementation Plan

Greenfield Tauri 2 + React/TS desktop app for writers. Windows + Linux. Offline-first, folder-on-disk projects, three board types (Plot Line, Info Map, Notes), Quill design system via CSS custom properties.

Stack decisions (agreed 2026-09-18):
- **Shell:** Tauri 2 (Rust backend, system webview)
- **Frontend:** React 18 + TypeScript + Vite
- **Storage:** project = folder on disk (`<Name>.plotr/`) with JSON files + assets subfolder. Export/backup = zip.

---

## 1. On-Disk Project Format

A project is a folder named `<Name>.plotr/`. All JSON is pretty-printed (2-space). Every file carries `schemaVersion: 1`. IDs are nanoid(12) with a type prefix (`note_`, `brd_`, `fld_`, `cat_`, `pt_`, `it_`, `cn_`, `sec_`, `ref_`, `tr_`).

```
MyStory.plotr/
├── project.json          # meta + categories
├── tree.json             # project-level folder/board tree (flat list)
├── trash.json            # tombstone entries for in-project trash
├── notes/
│   └── note_<id>.json    # one file per note — the project-wide notes collection
├── boards/
│   └── brd_<id>.json     # one file per board (all three types)
└── assets/
    └── <sha256first16>.<ext>   # content-hashed imported files/images
```

Rationale: per-note files make linked copies natural (boards store `noteId` references only), keep autosave writes small and per-file, and survive partial corruption. `tree.json` is flat (`parentId` + `order`) — atomic to edit, trivial for dnd reordering.

### project.json
```json
{
  "schemaVersion": 1,
  "id": "prj_a1b2c3d4e5f6",
  "name": "The Silent Kingdom",
  "description": "",
  "coverImage": "assets/9f2c3a1b8d4e.jpg",
  "genre": "Fantasy",
  "status": "drafting",
  "categories": [
    { "id": "cat_ch01", "name": "Character", "color": "oklch(0.55 0.18 300)" }
  ],
  "createdAt": "2026-09-18T10:00:00Z",
  "modifiedAt": "2026-09-18T10:00:00Z"
}
```
Category colors stored as oklch strings; presets from the Quill palette, custom via picker.

### tree.json
```json
{
  "schemaVersion": 1,
  "items": [
    { "id": "fld_wb", "kind": "folder", "name": "Worldbuilding", "parentId": null, "order": 0 },
    { "id": "brd_ch", "kind": "board", "boardType": "notes",
      "name": "Characters", "parentId": "fld_wb", "order": 0,
      "description": "", "icon": "users", "color": null }
  ]
}
```

### notes/note_*.json
```json
{
  "schemaVersion": 1,
  "id": "note_qelara01",
  "title": "Queen Elara",
  "doc": { "type": "doc", "content": [] },
  "categoryIds": ["cat_ch01"],
  "color": null,
  "attachments": [
    { "id": "att_01", "path": "assets/ab12cd34ef56.pdf",
      "fileName": "castle-map.pdf", "size": 182044, "mime": "application/pdf" }
  ],
  "createdAt": "...", "modifiedAt": "..."
}
```
Wiki-links are a custom TipTap inline node: `{ "type": "wikiLink", "attrs": { "noteId": "note_x", "label": "Queen Elara" } }` — label is a snapshot, resolved live against the notes store at render. Inline images are `image` nodes with `src` = project-relative `assets/...` path (converted to asset-protocol URL at render, never stored absolute).

### boards/ — Notes board
```json
{
  "schemaVersion": 1, "id": "brd_ch", "type": "notes",
  "folders": [
    { "id": "nbf_01", "name": "Main Cast", "parentId": null, "order": 0 }
  ],
  "noteRefs": [
    { "id": "ref_01", "noteId": "note_qelara01", "folderId": "nbf_01", "order": 0, "pinned": true }
  ],
  "sort": { "by": "manual", "dir": "asc" }
}
```
A **linked copy** anywhere = another ref/point/item with the same `noteId`. Refcount computed at load by scanning all boards — never persisted. Link indicator shows when refcount > 1. **Make Independent** = deep-clone note file with new id, repoint that one reference.

### boards/ — Plot Line board
```json
{
  "schemaVersion": 1, "id": "brd_pl", "type": "plotline",
  "points": [
    { "id": "pt_01", "noteId": "note_qelara01", "x": 0.34, "y": 0.78, "expanded": false }
  ],
  "sections": [
    { "id": "sec_01", "name": "Act I", "start": 0.0, "end": 0.25 }
  ],
  "view": { "zoom": 1, "panX": 0 }
}
```
`x` = story position 0..1, `y` = intensity 0..1 (1 = high). Ordering derived from `x`, never stored.

### boards/ — Info Map board
```json
{
  "schemaVersion": 1, "id": "brd_im", "type": "infomap",
  "items": [
    { "id": "it_01", "kind": "note",  "noteId": "note_qelara01",
      "x": 120, "y": 80, "w": 260, "h": 180, "parentId": null, "z": 2 },
    { "id": "it_02", "kind": "image", "assetPath": "assets/9f2c3a1b8d4e.jpg",
      "x": 420, "y": 80, "w": 200, "h": 150, "parentId": "it_04", "z": 1 },
    { "id": "it_03", "kind": "text",  "text": "The North", "fontSize": 18,
      "x": 300, "y": 300, "w": 160, "h": 40, "parentId": null, "z": 1 },
    { "id": "it_04", "kind": "group", "title": "Royal Family",
      "x": 400, "y": 40, "w": 400, "h": 320, "parentId": null, "z": 0 }
  ],
  "connections": [
    { "id": "cn_01", "from": "it_01", "to": "it_02", "kind": "arrow", "label": "rules" }
  ],
  "view": { "x": 0, "y": 0, "zoom": 1 }
}
```
`parentId` on an item = React Flow parent node (group membership). Child `x/y` relative to the group, matching React Flow semantics — persist exactly what React Flow holds.

### trash.json (in-project trash)
Tombstone entries carry a full snapshot payload so restore is self-contained:
```json
{
  "schemaVersion": 1,
  "entries": [
    { "id": "tr_01", "kind": "board", "deletedAt": "...",
      "originPath": ["Worldbuilding"], "displayName": "Characters",
      "payload": { "treeItems": [] } },
    { "id": "tr_02", "kind": "noteRef", "deletedAt": "...",
      "originPath": ["Worldbuilding", "Characters", "Main Cast"],
      "boardId": "brd_ch", "noteId": "note_qelara01",
      "payload": { "ref": { "id": "ref_01", "folderId": "nbf_01", "order": 0, "pinned": false } } }
  ]
}
```
Rules: deleting a tree item moves its tree entries into a tombstone (board files stay in `boards/`); deleting a note ref moves the ref into a tombstone (note file stays in `notes/`). **Empty Trash** physically deletes board files and any note/asset files no longer referenced anywhere (GC runs only then). **Restore** re-inserts payload at origin, or at root if origin no longer exists.

**App-level trash for whole projects:** move project folder to `<appDataDir>/trash/<timestamp>_<name>/`, recorded in `<appDataDir>/trash/index.json`.

**Export/backup** = zip of the folder; **import** = unzip + validate `project.json` + `schemaVersion <= current`.

---

## 2. Repo / Module Structure

```
Plotr/
├── package.json, vite.config.ts, tsconfig.json, index.html
├── docs/
├── src/
│   ├── main.tsx
│   ├── App.tsx                    # screen switch + global providers + modal host
│   ├── styles/
│   │   ├── tokens.css             # Quill: --ink, --paper, category colors, radii 4/6/8/12/14,
│   │   │                          #   --ease: cubic-bezier(.2,.7,.2,1), fonts; [data-theme=dark]
│   │   └── base.css
│   ├── app/
│   │   ├── navStore.ts            # screen state machine (§5)
│   │   ├── shortcuts.ts           # global keyboard routing
│   │   └── theme.ts
│   ├── tauri/
│   │   └── commands.ts            # typed wrappers for every Rust command + assetUrl() helper
│   ├── lib/
│   │   ├── ids.ts                 # nanoid + prefixes
│   │   ├── saveQueue.ts           # dirty tracking, debounce, per-file atomic writes, flush()
│   │   ├── undoStack.ts           # generic command stack factory (per board)
│   │   ├── schema.ts              # TS types for all on-disk shapes + migrate()
│   │   └── markdownExport.ts      # TipTap JSON → Markdown
│   ├── stores/
│   │   ├── projectStore.ts        # project.json + tree.json + open/close lifecycle
│   │   ├── notesStore.ts          # Map<noteId, Note>, refcounts, CRUD, makeIndependent()
│   │   ├── boardStore.ts          # factory: store per open board (any type)
│   │   ├── searchStore.ts         # minisearch index lifecycle
│   │   ├── trashStore.ts
│   │   └── settingsStore.ts       # app settings + recents (tauri-plugin-store backed)
│   ├── components/ui/             # Button, IconButton, Modal, ContextMenu, Dropdown, Input,
│   │                              #   Chip, ColorPicker, Toast, Tooltip, EmptyState, ConfirmDialog
│   ├── components/shell/          # Dock (breadcrumb left / actions right), Spine (320px dark
│   │                              #   panel, Start+Dashboard only), Breadcrumb
│   └── features/
│       ├── start/                 # StartScreen, RecentProjects, CreateProjectModal
│       ├── dashboard/             # DashboardScreen, TreeView, BoardTile, CreateBoardModal
│       ├── project-settings/      # ProjectSettingsScreen, CategoryManager
│       ├── app-settings/          # AppSettingsScreen
│       ├── note-editor/           # NotePopup (read/edit), RichTextToolbar, tiptap/ (extensions,
│       │                          #   WikiLink node + suggestion, AttachmentList, LinkedBadge)
│       ├── notes-board/           # NotesBoardScreen, FolderTree, NoteList, NoteRow, dnd wiring
│       ├── plotline/              # PlotLineScreen, PlotCanvas (SVG), PlotDot, SectionLayer,
│       │                          #   SectionManager, ZoomControls, PointListView, usePlotViewport
│       ├── infomap/               # InfoMapScreen, nodes/ (NoteNode, ImageNode, TextNode,
│       │                          #   GroupNode), ConnectionEdge, AddPanel, useFlowSync
│       ├── search/                # QuickSearchOverlay, SearchResultsScreen, ResultRow
│       └── trash/                 # TrashScreen (project trash + app-level project trash tab)
└── src-tauri/
    ├── tauri.conf.json            # assetProtocol enabled, window-state plugin
    ├── Cargo.toml
    ├── capabilities/default.json
    └── src/
        ├── main.rs / lib.rs       # builder, plugin registration
        ├── commands/
        │   ├── project.rs         # create/load/list-files
        │   ├── files.rs           # atomic read/write/delete inside project
        │   ├── assets.rs          # attachment import (hash + copy)
        │   ├── archive.rs         # zip export/import
        │   └── trash.rs           # app-level project trash
        ├── fsutil.rs              # atomic_write (atomicwrites), path validation (no ../ escape)
        └── error.rs               # thiserror -> serialized command errors
```

**boardStore.ts factory:** each opened board gets an instance holding its parsed board file, an `undoStack`, and type-specific actions. Only mutations to note *content* go through `notesStore` — this makes linked-copy sync automatic: every note card/dot/row renders from `notesStore` by `noteId`, so an edit in one popup re-renders every open view.

---

## 3. Tauri Command Surface

Rust stays thin — validated file IO only. All paths validated to stay inside the project root. All commands `async`, errors as `Result<T, AppError>` serialized to a typed TS error.

| Command | Signature (conceptual) | Purpose |
|---|---|---|
| `create_project` | `(parent_dir, name, meta_json) -> ProjectPath` | mkdir `<name>.plotr`, write skeleton files, create notes/ boards/ assets/ |
| `load_project` | `(project_path) -> ProjectBundle` | Read every JSON file into one payload; extend asset-protocol scope to project dir |
| `write_project_file` | `(project_path, rel_path, contents) -> ()` | Atomic write (tmp + replace) — the only save primitive |
| `delete_project_file` | `(project_path, rel_path) -> ()` | Used by Empty Trash GC |
| `import_attachment` | `(project_path, source_path) -> AttachmentMeta` | sha256, copy to `assets/<hash16>.<ext>`, dedupe |
| `import_attachment_bytes` | `(project_path, file_name, bytes) -> AttachmentMeta` | Pasted/dropped image data |
| `export_zip` | `(project_path, dest_zip) -> ()` | Walk folder → zip (after frontend flushes saves) |
| `import_zip` | `(zip_path, dest_dir) -> ProjectPath` | Unzip, validate project.json, guard zip-slip |
| `write_export_files` | `(dest_dir, files) -> ()` | Markdown export: TS renders, Rust writes the tree |
| `trash_project` | `(project_path) -> ()` | Move folder to `<appData>/trash/`, update index |
| `list_trashed_projects` / `restore_project` / `purge_trashed_project` | — | App-level project trash screen |

Handled by **plugins**: dialogs (`tauri-plugin-dialog`), settings + recents (`tauri-plugin-store`), open-in-OS (`tauri-plugin-opener`), window geometry (`tauri-plugin-window-state`).

---

## 4. Key Libraries

**Frontend (npm):**
- `react`/`react-dom` `^18.3`, `typescript` `~5.6`, `vite` `^6`, `@vitejs/plugin-react`
- `@tauri-apps/api` `^2.1` + `@tauri-apps/plugin-dialog`, `-store`, `-opener` (`^2`)
- `zustand` `^5`
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `-task-list`, `-task-item`, `-link`, `-image`, `-text-align`, `@tiptap/suggestion` (`^2.10`)
- `@xyflow/react` `^12.3` — Info Map only
- `@dnd-kit/core` `^6` + `@dnd-kit/sortable` `^8`
- `minisearch` `^7`, `nanoid` `^5`, `clsx` `^2`

**Rust:** `tauri` 2.x, `serde`/`serde_json`, `atomicwrites` 0.4, `zip` 2, `sha2` 0.10, `walkdir` 2, `thiserror` 2, plugins: window-state, dialog, store, opener.

**Not used:** react-router (state-based nav); tiptap markdown packages (hand-rolled ~200-line serializer over a known node set).

---

## 5. Screens → Navigation

**State-based navigation via Zustand `navStore`, no react-router.** Single-window desktop app; breadcrumb derives from the project tree, not a URL. `navStore` keeps a small back-stack for Esc/back behavior.

```ts
type Screen =
  | { name: "start" }                      // 1. Start/Home (Spine visible)
  | { name: "dashboard" }                  // 3. Project Dashboard (Spine visible)
  | { name: "board"; boardId: string }     // PlotLine | InfoMap | NotesBoard by tree type
  | { name: "search"; query: string }      // 5. Full search results
  | { name: "trash" }                      // 6. Trash
  | { name: "projectSettings" }            // 7. Project Settings
  | { name: "appSettings" };               // 8. App Settings
```
- **Create Project** and **Board Creation** are modals, not screens.
- Quick search = overlay (Ctrl+Shift+F) on any screen; "See all results" pushes `search`.
- Note popup (read/edit) = modal layer independent of screen — works over all board types.
- Dock renders on all project screens; Spine only on `start` and `dashboard`; boards full-bleed under the dock.

---

## 6. Implementation Order — 6 Phases

Each phase ends runnable via `npm run tauri dev`.

**Phase 1 — Scaffold, shell, projects.** Tauri 2 + Vite + React + TS scaffold; `tokens.css` (Quill palette, self-hosted fonts, radii, easing, light/dark); Dock/Spine/Breadcrumb; navStore; Rust `create_project`/`load_project`/`write_project_file` + atomic writes; saveQueue; Start screen with recents; Create Project modal; Dashboard with tree rendering, create/rename folder + board, navigation into placeholder board screens; core UI kit.

**Phase 2 — Notes system + editor.** notesStore; TipTap editor (full extension set); NotePopup read/edit (Esc, dbl-click-to-edit); Notes board (folder tree + list, dnd-kit, sort, pin); categories (manager, chips, color picker); linked copies (duplicate-as-linked, refcount indicator, Make Independent + confirmation); wiki-link `[[` suggestion; autosave through saveQueue.

**Phase 3 — Search, attachments, trash.** minisearch index (built on load, incrementally updated); quick-search overlay + full results screen (title boost, path context); attachment import + inline images via asset protocol + paste/drop; in-project trash + Trash screen + GC; app-level project trash.

**Phase 4 — Plot Line.** SVG canvas, pan/zoom viewport hook (horizontal zoom, vertical fits height); dots from normalized coords; drag with live reorder; intensity grid + High/Med/Low; sections (render + Manage Sections + drag boundaries); expanded point cards anchored to dots; expand/collapse all; list view toggle; Add Plot Point; per-board undo stack.

**Phase 5 — Info Map.** React Flow, 4 custom node types; add/tool panel (click-to-place + drag-out); NodeResizer; groups as parent nodes with drag-into/out-of; line/arrow edges with labels; selection toolbar + context menus; Delete key; undo for structural ops; persist through boardStore.

**Phase 6 — Export/import, settings, polish.** Zip export/import; Markdown export; App Settings (theme, autosave toggle, default location, shortcut reference); manual-save mode (dirty badge, Ctrl+S, unsaved prompt via close-requested); shortcut audit; window-state; dark-mode + empty/error-state QA pass.

---

## 7. Risks & Tricky Bits

- **Linked-note sync:** note content lives only in `notesStore`; boards store `noteId`. All renderers subscribe by id — no sync code to get wrong. Only one edit popup open at a time (modal), so no concurrent editors.
- **Wiki-link autocomplete:** `@tiptap/suggestion` with `[[`; queries in-memory title list from `notesStore`. Labels are snapshots; render resolves current title by id, "missing note" style if gone.
- **React Flow group drag:** native `parentId`, `extent` unset; re-parent on drag-end via `getIntersectingNodes`, convert absolute↔parent-relative coords; keep parents before children in nodes array. Encapsulate in `useFlowSync`; unit-test the coordinate conversion.
- **Plot line zoom math:** viewport `{panX, zoom}`; `screenX = (x * baseWidth - panX) * zoom`; cursor-anchored zoom adjusts panX so point under cursor is invariant; fit-to-view solves from min/max x + padding. Keep it 1-D.
- **Asset protocol dev vs prod:** `convertFileSrc()` everywhere via a single `assetUrl()` helper; enable assetProtocol with dynamic scope extension at `load_project`. Test in dev AND built bundle in Phase 3.
- **Atomic saves on Windows:** `fs::rename` fails when dest exists — use `atomicwrites` crate; retry 3× with backoff (antivirus locks); tmp file in same directory as target.
- **Keyboard shortcut routing:** one window-level keydown listener with priority chain: editor-focus → modal Esc → board actions. Components register handlers with the router; never attach their own listeners.
- **Save-queue vs close race:** intercept close-requested, `flush()` (prompt in manual mode), then close.

---

## 8. Verification Per Phase

All phases: `npm run tauri dev` (build smoke test at phases 3 and 6).

- **P1:** Create project → inspect folder on disk; reopen → in recents; folders/boards → tree.json updates; breadcrumb navigates; dark mode; kill app mid-edit → JSON intact.
- **P2:** Notes with every rich-text feature; `[[` autocomplete → link opens target; linked copy edit syncs live with badge; Make Independent stops propagation; drag between folders; pin + sort.
- **P3:** Ctrl+Shift+F body-phrase search → results with paths, titles first; attach PDF; paste image → hashed file in assets/, renders in dev and built bundle; delete → restore; Empty Trash GC.
- **P4:** Drag points, cursor zoom, Fit to View, sections, expand/collapse all, Ctrl+Z reverts drag, restart → identical.
- **P5:** Character-map flow: note + image, labeled arrow, group drag moves children, drag-out keeps world coords, Delete, undo, reload → identical.
- **P6:** Zip export → import elsewhere → identical; Markdown export mirrors tree; manual-save mode prompts on close; window state restored; full shortcut list per brief §40.
