# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primarily the author, as a personal tool. Public release is not a goal now. The user plans many kinds of story projects: novels and short fiction, game design (levels, mechanics, mood boards), scripts, and worldbuilding or lore bibles. Sessions are long, solo, and repeated over months on the same project.

## Product Purpose

Plotr is an offline-first desktop workspace for planning stories. It holds a project's structure, research, worldbuilding, and notes in one place, so the writer can see the shape of the story and find any piece of it again. Success means low-friction capture and a clear view of the whole story, not project management.

## Positioning

Plotr joins three views of one story over a shared pool of reusable notes: a Plot Line (story moments placed by position and intensity, grouped into user-named sections), an Info Map (a free canvas of note cards, images, text, groups, and labelled connections), and Notes boards (a structured library). The same note appears on several boards as a linked copy. Projects are plain folders of JSON and assets on disk, never locked in a service.

## Operating Context

- Desktop app (Tauri 2 webview + React 19) on Windows and Linux. Keyboard and mouse. Desktop windows from about 860px wide upwards.
- A project is a folder `Name.plotr/` with project.json, tree.json, boards/, notes/, assets/, trash.json. It can be zipped, moved, or synced like any folder.
- Navigation is Project → Folders → Boards. A left sidebar holds the project tree as the persistent navigation; the header shows the path.
- The dashboard is for orientation and navigation, never analytics.

## Capabilities and Constraints

- Board types: Plot Line, Info Map, Notes. Folders nest to any depth.
- Notes: TipTap rich text, categories with colours, attachments, inline images, `[[wiki-links]]`, pin, linked copies with "Make independent".
- Project-wide search, trash with restore, zip backup and import, Markdown export, autosave or manual save, Pinterest connector for images.
- Story terms (acts, climax, arcs) must never be required concepts; section names are the user's own.
- Light, dark, and system themes must stay.
- Offline: everything for normal use works with no network.

## Brand Commitments

- Name: Plotr. Tagline in use: "A quiet workspace for stories".
- The application should not feel like enterprise project management software, a database editor, or an IDE.
- Look and feel (standing preference, 2026-09-29): a smooth, clean, modern desktop app at the craft level of Craft and Apple's own apps. Convention is the goal, done at full fidelity; no themed costume (the "Galley Proof" book look was rejected).

## Evidence on Hand

- Product brief: docs/mvp-brief.md. Architecture: docs/implementation-plan.md.
- Real user project: "THERMITE" (game design, an Info Map mood board).
- No testimonials, users, or metrics exist; do not invent them.

## Product Principles

1. Content over interface: the writer's words and the story's shape lead every screen.
2. Low friction: capture a note, moment, or connection in as few steps as possible.
3. Organisation first: every item has a findable place.
4. No imposed method: the tool adapts to how each writer structures a story.
5. The files belong to the writer.
