# Plotr

An offline-first desktop workspace for writers — organise projects, story
structure, research, worldbuilding and notes. Windows + Linux.

Built with **Tauri 2** (Rust) + **React 19 / TypeScript / Vite**, styled by the
"Quill" design system (see `docs/design/`).

## Concepts

- A **project** is a folder on disk (`My Story.plotr/`) — plain JSON + assets.
  Fully offline; back up, move or sync it like any folder.
- **Project → Folders → Boards.** Three board types:
  - **Plot Line** — story moments on a timeline; horizontal = position in the
    story, vertical = intensity. User-defined sections (acts, journeys, …).
  - **Info Map** — freeform canvas: note cards, images, text labels, group
    frames, and labelled line/arrow connections.
  - **Notes** — a structured note library with nested folders, pinning,
    sorting and filtering.
- **Notes are reusable.** The same note can appear on several boards as a
  linked copy — edit one, every instance updates. "Make Independent" splits a
  copy off.
- Rich text (TipTap): headings, lists, checklists, quotes, links, images,
  and `[[wiki-links]]` between notes.
- Project-wide search (Ctrl+Shift+F), categories with colours, trash with
  restore, zip backup/import, Markdown export.

## Install

```sh
# Windows (PowerShell) — installs to the Start menu / app search
powershell -ExecutionPolicy Bypass -File scripts\install.ps1

# EndeavourOS / Arch — installs to ~/.local with a desktop entry
bash scripts/install.sh
```

Both scripts build from this checkout and install the result. The in-app
**Update Plotr** button (App Settings) pulls this repo, re-runs the install
script, and relaunches — it needs the repo to have a git remote configured.

## Development

```sh
npm install
npm run tauri dev      # run the app
npx tsc --noEmit       # typecheck
npm run tauri build    # release bundles
```

The Rust side (`src-tauri/`) is a thin, validated file-IO layer; all product
logic lives in the React app (`src/`). On-disk schemas: `src/lib/schema.ts`.
Architecture and phase plan: `docs/implementation-plan.md`; product brief:
`docs/mvp-brief.md`.

## Project folder format

```
My Story.plotr/
├── project.json     # metadata + categories
├── tree.json        # folder/board tree
├── trash.json       # restorable deleted items
├── notes/           # one JSON file per note
├── boards/          # one JSON file per board
└── assets/          # content-hashed images & attachments
```
