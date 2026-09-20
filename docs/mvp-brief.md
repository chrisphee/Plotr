# Writer App — Product Logic & UX Design Handoff

## 1. Product Summary

This is an offline-first desktop application for writers to organise projects, story structure, research, worldbuilding, and notes.

The primary organising hierarchy is:

**Project → Folder → Board**

Folders may contain:

* Boards
* Other folders

Folder nesting may continue to arbitrary depth.

The MVP contains three board types:

1. **Plot Line**
2. **Info Map**
3. **Notes**

The application is primarily designed for:

* organisation
* low-friction writing workflows
* visual understanding of a story
* long-term personal projects

The desktop experience is the priority.

Initial supported platforms:

* Windows
* EndeavourOS / Linux

A future Android companion application may provide a reduced feature set, but mobile considerations should not restrict the MVP desktop UX.

---

# 2. Core Product Principles

The UX should prioritise:

### Organisation first

A writer should be able to understand where information belongs and locate it again later.

### Low friction

Creating:

* notes
* plot points
* research items
* folders
* connections

should require as few interactions as reasonably possible.

### Content over interface

The application should avoid feeling like:

* enterprise project management software
* a database editor
* an IDE

unless the user deliberately chooses a denser UI style.

### Visual flexibility

Different writers organise information differently.

The UI should allow flexible:

* folder structures
* board structures
* categories
* colours
* canvas layouts

without requiring a predefined writing methodology.

Terms such as:

* Act I
* Act II
* climax
* character arc

must not be hardcoded as required concepts.

### Offline-first

Everything required for normal use must work without an internet connection.

---

# 3. Project Files

Projects are file-based rather than exclusively managed inside an application database.

A project should behave conceptually like a document file.

Example:

`The Silent Kingdom.writerproject`

The exact extension is not important to UX design.

Users should conceptually be able to:

* Create Project
* Open Project
* Open Recent Project
* Save Project
* Save Project As
* Export Project
* Import Project

The app should remember recently opened projects.

The application may also reopen the most recently used project and board when launched.

---

# 4. Project Metadata

A Project may contain:

* Name
* Description
* Optional cover image
* Optional genre
* Optional project status
* Project-wide categories
* Project-wide colour definitions

Project metadata should be editable from a Project Settings or Project Details interface.

---

# 5. Project Organisation

A project contains a folder tree.

Example:

The Silent Kingdom

* Plot

  * Main Plot
  * Subplots
* Worldbuilding

  * Characters
  * Locations
  * Factions
* Research

  * Inspiration
  * Real World References
* Notes

  * General Notes

Folders may contain both:

* subfolders
* boards

Boards may be manually reordered.

Folders may be manually reordered.

Drag-and-drop organisation is desirable.

---

# 6. Navigation Model

The MVP should use **breadcrumbs as the primary persistent navigation system**.

Example:

`Projects > The Silent Kingdom > Worldbuilding > Characters`

The MVP does not require a permanently visible project sidebar.

Designs may introduce contextual panels where useful, but a fixed sidebar must not be assumed as a product requirement.

Breadcrumb items should be clickable.

Clicking the Project breadcrumb should return to the Project Dashboard.

---

# 7. Project Dashboard

Every project has a dashboard.

The dashboard provides an overview of:

* folders
* boards
* project metadata
* recently used boards
* pinned/favourite boards if implemented visually
* possibly recent notes

The dashboard is primarily a navigation and orientation screen.

It should not become an analytics dashboard.

---

# 8. Board Creation

When creating a board, the user chooses one of:

* Plot Line
* Info Map
* Notes

Each board requires:

* Name

Optional:

* Description
* Icon
* Colour

Boards should be renameable and movable after creation.

---

# 9. Notes — Core Data Model

A note is a reusable rich-text object.

A note may contain:

* Title
* Rich-text body
* Categories/tags
* Display colour
* Inline images
* File attachments
* Links to other notes
* Created date
* Modified date

Version history is not required.

---

# 10. Shared Notes / Linked Copies

Notes may appear in more than one location.

Duplicating a note should create a **linked copy by default**.

Linked copies reference the same underlying note.

Editing one linked copy updates every linked instance.

Example:

`Queen Elara`

may appear in:

* Characters Notes folder
* Info Map
* Plot Line

while remaining the same underlying note.

The UI must clearly avoid making this behaviour surprising.

A linked copy may be converted into an independent note.

Suggested wording:

**Make Independent**

or

**Unlink Copy**

After this operation:

* the copy becomes its own note
* future edits no longer synchronise

A subtle linked-note indicator should exist wherever appropriate.

---

# 11. Note Editing

Clicking a note opens a popup/modal.

Default state:

* reading/view mode

Available action:

* Edit

When Edit is selected:

* the same popup becomes editable

Optional interaction:

* double-click opens directly into edit mode

`Esc` should close the popup where appropriate.

---

# 12. Rich Text Capabilities

MVP rich text should support:

* Paragraphs
* Headings
* Bold
* Italic
* Underline if visually appropriate
* Bullet lists
* Numbered lists
* Checklists
* Links
* Block quotes
* Basic text alignment if desired
* Images

Advanced document-layout tools are not required.

---

# 13. Note Linking

Notes may reference other notes using a lightweight wiki-style interaction.

Typing:

`[[`

should open a note search/autocomplete menu.

Example:

`[[Queen Elara]]`

The resulting reference should be clickable.

Clicking the reference opens the referenced note.

Cross-board visual relationships beyond note links are not required for MVP.

---

# 14. Autosave

Autosave is available and enabled by default.

Setting:

**Automatically save while editing**

When enabled:

* edits save continuously

When disabled:

* an explicit Save action is available

Closing an unsaved editor should prompt:

* Save
* Discard
* Cancel

The current autosave state should be understandable but should not dominate the UI.

---

# 15. Categories

Categories belong to the Project rather than individual boards.

A category consists of:

* Name
* Colour

Example:

* Character — Purple
* Location — Green
* Conflict — Red
* Lore — Blue

Users may create, rename, recolour, and delete categories.

Changing the colour of a category updates all items using that category.

Items may have multiple categories.

Colour selection should provide:

* preset colours
* custom colour picker

An item may optionally have a custom display colour independent of category colouring if the design can communicate the distinction clearly.

---

# 16. Plot Line Board

The Plot Line represents a single story progression.

It is primarily horizontal.

Horizontal position represents:

**position in the story**

It is intentionally relative rather than tied to:

* page number
* chapter number
* date

Conceptually:

`Beginning ------------------------- Ending`

---

# 17. Plot Points

Plot points are notes positioned on the timeline.

In collapsed state:

* the plot point appears as a dot

The dot may use:

* note/category colour

Selecting or expanding the point shows its note.

Expanded notes should visually remain associated with their point.

Multiple points may occupy approximately the same story position.

Each point represents a single moment rather than a duration/range in MVP.

---

# 18. Plot Point Movement

Plot points can be dragged:

### Horizontally

Changes story position.

Horizontal movement also changes the ordering of plot points.

### Vertically

Changes perceived:

* tension
* intensity

This value is deliberately approximate.

Users should not need to interact with explicit values such as:

`Tension: 73`

Instead the position itself communicates intensity.

---

# 19. Plot Line Grid

The plot area may contain a faint grid.

Vertical interpretation:

* High
* Medium
* Low

or equivalent subtle visual guidance.

The grid should aid visual comparison without turning the board into a quantitative chart.

---

# 20. Plot Sections

Plot Lines may optionally contain user-defined sections.

Examples:

* Act I
* Act II
* Act III

or

* Beginning
* Journey
* Siege
* Aftermath

Sections are completely user-defined.

Each section may have:

* Name
* Start position
* End position

Sections should be editable, movable, and removable.

Plot Line boards do not require sections.

---

# 21. Plot Line Zoom

The Plot Line must support zooming.

The user should be able to:

* zoom out to see the overall story
* zoom in for detailed editing

A **Fit to View** action is useful.

---

# 22. Plot Line Views

MVP primarily uses the graphical Plot Line.

However, a lightweight list view of plot points is desirable if it does not significantly complicate the interface.

At minimum there should be an easy way to:

* expand all
* collapse all

The MVP does not require:

* multiple plot lanes
* automatic story structure
* tension curves
* chapter automation

A line joining points is optional visual decoration only and should not imply calculated meaning.

---

# 23. Info Map Board

The Info Map is a freeform infinite canvas.

It supports:

* pan
* zoom
* drag
* resize

It should feel similar to modern visual brainstorming/canvas tools while remaining focused on writing.

---

# 24. Info Map Item Types

MVP contains four primary canvas items:

### Note

A rich-text note card.

### Image

A free-standing image.

### Text

A simple free-floating text label.

### Group

A visual container/frame used to organise canvas content.

---

# 25. Info Map Creation

Items should primarily be created through an Add/tool panel.

Example:

Add

* Note
* Image
* Text
* Group

The user may drag an item type onto the canvas.

Alternative quick-create interactions may be added later.

Double-click-to-create is not an MVP requirement.

---

# 26. Info Map Notes

Note cards may be resized freely.

Rotation is not required.

Cards may overlap.

Cards may display:

* title
* category colours
* short preview
* image/thumbnail if relevant

Opening the card opens the associated note popup.

---

# 27. Groups

Groups are frames placed around related items.

Groups should:

* have a title
* be resizeable
* visually contain items

Moving the group should move the items contained within it.

Automatic layout or automatic organisation is not required.

---

# 28. Connections

Canvas objects may be connected.

MVP connection types:

### Line

Undirected relationship.

### Arrow

Directional relationship.

Connections:

* remain attached when objects move
* may have an optional text label

Example:

`Queen Elara → rules → Northern Kingdom`

or

`Elara — siblings — Kael`

Advanced styling is not required.

Do not require:

* custom routing
* animated connections
* complex arrowhead types
* multiple line patterns

---

# 29. Notes Board

The Notes board is a structured note library.

Its primary organisation model is:

**Folders → Subfolders → Notes**

Folders may nest to arbitrary depth.

Each note physically belongs to one folder within a Notes board.

Categories/tags allow cross-folder organisation.

---

# 30. Notes Board Layout

Only one primary view is required for MVP.

The default recommendation is a folder/tree + note list or equivalent library layout.

The Notes board should support:

* Create Note
* Create Folder
* Rename
* Move
* Drag and drop
* Pin/favourite
* Sort
* Search

---

# 31. Notes Sorting

Users should be able to sort by:

* Manual order
* Title
* Date created
* Date modified

Ascending/descending where appropriate.

---

# 32. Favourite / Pinning

Notes may be pinned/favourited.

The distinction between the terms “Pinned” and “Favourite” should be resolved by the final visual language.

Only one mechanism is required.

---

# 33. Search

The app provides project-wide/global search.

Search should include:

1. Note titles
2. Board names
3. Folder names
4. Categories/tags
5. Note body content
6. Attachment filenames
7. Image filenames

Title matches should be prioritised above body-content matches.

Search results should show context.

Example:

**Queen Elara**
`Worldbuilding > Characters > Main Cast`

**Elara discovers the betrayal**
`Plot > Main Plot`

---

# 34. Search Screens

There should be:

### Quick/global search interface

Accessible from primary navigation.

### Full Search Results screen

Useful when many matches exist.

Command palette behaviour is explicitly post-MVP.

---

# 35. Trash

Deleting supported objects sends them to a global Trash rather than immediately destroying them.

Trash can contain:

* Projects where technically feasible
* Boards
* Folders
* Notes

Users may:

* Restore
* Permanently Delete
* Empty Trash

No automatic deletion timer is required.

---

# 36. Attachments

Notes support file attachments.

Images may appear inline.

Other files should appear as attachment items showing useful metadata such as:

* file name
* file type
* file size

Attachments should conceptually become part of the project rather than remaining dependent on their original disk location.

The UX should therefore imply:

**Attach / Import**

rather than merely:

**Link to external file**

---

# 37. Export

Projects should support two export goals.

### Backup / Transfer

A lossless project package containing:

* project structure
* notes
* board data
* categories
* canvas positions
* plot positions
* attachments/images

This package must be importable again.

### Human-readable export

Notes should be exportable to Markdown.

A project-level Markdown export may reproduce folder organisation.

PDF export is not required for MVP.

---

# 38. Import

The application must support restoring/importing its own project export format.

Markdown import is optional and post-MVP unless inexpensive to implement.

---

# 39. Undo / Redo

Undo and redo should work for normal editing operations wherever reasonably expected.

Especially:

* text editing
* canvas movement
* resizing
* connection creation
* plot point movement

---

# 40. Basic Keyboard Shortcuts

MVP should support familiar shortcuts.

Suggested defaults:

* `Ctrl + N` — contextual new item
* `Ctrl + S` — save
* `Ctrl + F` — search current context
* `Ctrl + Shift + F` — project/global search
* `Ctrl + Z` — undo
* `Ctrl + Shift + Z` — redo
* `Delete` — delete selected canvas item
* `Esc` — close modal / cancel / deselect

Exact mappings may be adjusted for platform conventions.

---

# 41. Required Screens

The design agent should produce designs for the following screens/states.

## Application-level screens

### 1. Start / Home

Contains:

* Create Project
* Open Project
* Recent Projects

Potential secondary items:

* Settings
* Import Project

---

### 2. Create Project

Fields:

* Project name
* Location
* Optional description
* Optional cover

The design should not overwhelm new users with configuration.

---

### 3. Project Dashboard

Contains:

* Project name
* Project metadata
* Folders
* Boards
* Create folder
* Create board
* Recently opened content

This is the project's home screen.

---

### 4. Board Creation

User chooses:

* Plot Line
* Info Map
* Notes

Board type should have a short explanation and visual icon/preview.

---

### 5. Project Search

Contains:

* Search field
* Filters if helpful
* Results
* Result locations
* Category indicators

---

### 6. Trash

Contains:

* deleted items
* original location
* deletion date if useful
* Restore
* Delete Permanently
* Empty Trash

---

### 7. Project Settings

Contains:

* Project metadata
* Project categories
* project colour definitions
* possibly export/import actions

---

### 8. Application Settings

Contains:

* Appearance
* Light / Dark mode
* Autosave
* Behaviour preferences
* default project location if implemented
* keyboard shortcuts display
* future settings placeholders should not clutter MVP

---

# 42. Plot Line Screens / States

The design agent should design:

### Default Plot Line

Showing:

* breadcrumbs
* board title
* timeline
* grid
* collapsed plot-point dots
* optional sections
* zoom controls
* Add Plot Point

### Selected Plot Point

Shows point selection state.

### Expanded Plot Point

Shows note card visually connected to its point.

### Plot Note Popup

Read state.

### Plot Note Edit Popup

Editing state.

### Manage Sections

Create/edit/delete user-defined plot sections.

### Zoomed-in state

Important to ensure navigation remains understandable when only part of the timeline is visible.

---

# 43. Info Map Screens / States

Design:

### Empty Info Map

Should strongly communicate how to begin.

### Populated Info Map

Contains:

* notes
* images
* labels
* groups
* connections

### Add/Tool Panel

Contains:

* Note
* Image
* Text
* Group
* Line
* Arrow

### Selected Item

Must clearly indicate:

* selection
* resize handles where appropriate
* relevant actions

### Selected Connection

Allows:

* optional label
* delete

### Note Popup

Read and edit states.

### Group state

Show:

* selected group
* nested items
* drag behaviour conceptually

---

# 44. Notes Board Screens / States

Design:

### Notes Library

Shows:

* folders
* nested folders
* note list
* sort controls
* search
* favourites/pins

### Empty Folder

Should have a clear creation action.

### Note Popup

View mode.

### Note Edit Popup

Edit mode.

### Move Note / Folder

If drag-and-drop isn't sufficient for all situations.

---

# 45. Shared Note UX States

Because linked notes are unusual enough to cause confusion, explicitly design:

### Linked Note Indicator

A subtle icon/status.

### Linked Copy Context Menu

Actions may include:

* Open
* Edit
* Duplicate Linked
* Make Independent
* Move
* Delete

### Make Independent Confirmation

Should explain:

> This creates a separate copy. Future edits will no longer appear in the other linked instances.

Avoid technical terms such as database reference or shared object.

---

# 46. Common Modal / Popup States

The design system must cover:

* Read note
* Edit note
* Create item
* Rename
* Move
* Delete confirmation
* Permanent delete confirmation
* Unsaved changes
* Import
* Export
* Attach file
* Manage categories
* Colour picker

---

# 47. Design System — Core Components

The design agent should define reusable components rather than creating every screen independently.

## Navigation

* Breadcrumb
* Breadcrumb item
* Home/start navigation
* Back/forward controls if included
* Tab if the chosen UI direction uses tabs

## Buttons

* Primary button
* Secondary button
* Ghost button
* Icon button
* Destructive button
* Split/dropdown button where justified

Required states:

* default
* hover
* active
* focus
* disabled
* loading where applicable

---

# 48. Form Components

Required:

* Text input
* Search input
* Text area
* Checkbox
* Toggle
* Select/dropdown
* Number input if needed internally
* File picker
* Colour picker
* Category selector
* Tag/category chip editor

---

# 49. Category Components

Design:

* Category chip
* Category picker
* Category colour swatch
* Category manager row
* Add category interaction

Category chips must remain readable across arbitrary user-selected colours.

Accessibility contrast needs consideration.

---

# 50. Note Components

Design:

### Note Card

Variants:

* normal
* selected
* linked/shared
* pinned
* compact

### Note Preview

For list/search results.

### Note Popup

Variants:

* read
* edit

### Rich Text Toolbar

Keep visually lightweight.

### Attachment

File attachment row/card.

### Internal Note Link

Normal and hover states.

---

# 51. Folder Components

Design:

* Folder row/card
* Expanded folder
* Collapsed folder
* Nested folder indentation
* Drag target state
* Empty folder

Folders need to remain understandable at multiple nesting levels.

---

# 52. Board Components

Design:

* Board card/tile
* Board icon
* Board type indicator
* Selected board
* Board context menu

Distinct board types should be recognisable without relying exclusively on colour.

---

# 53. Canvas Components

Info Map requires:

* Canvas background
* Grid/dot background if used
* Canvas selection box
* Note node
* Image node
* Text node
* Group frame
* Resize handles
* Connection endpoint/handle
* Line
* Arrow
* Connection label
* Zoom controls
* Fit-to-view control
* Selection toolbar/context toolbar

---

# 54. Plot Components

Design:

* Plot timeline axis
* Faint intensity grid
* Plot dot
* Selected plot dot
* Hovered plot dot
* Plot note card
* Section region
* Section boundary
* Section title
* Timeline zoom
* Fit to view
* High / Medium / Low intensity labels

---

# 55. Feedback Components

Design system should include:

* Tooltip
* Toast
* Inline error
* Warning
* Confirmation
* Empty state
* Loading state
* Progress indicator for imports/exports if needed

---

# 56. Menus

Design:

* Context menu
* Dropdown menu
* Board item menu
* Note item menu
* Canvas object menu

Context menus are important because many actions should remain accessible without permanently occupying screen space.

---

# 57. Search Components

Design:

* Search field
* Search suggestions
* Search result row
* highlighted title match
* highlighted body snippet
* path/location display
* category indicators
* no-results state

---

# 58. Layout Components

The design system should establish patterns for:

* app shell
* top bar
* breadcrumb bar
* content header
* optional contextual side panel
* modal
* inspector panel
* floating tool panel
* bottom status/control area if used

These components may vary significantly between visual concepts.

The product does not require every screen to use the exact same panel configuration.

---

# 59. Light and Dark Modes

The complete system should support both.

The design agent does not need to produce every screen in both modes initially.

However, the component palette should be designed so both are feasible.

Particular attention should be paid to:

* category colours
* canvas lines
* plot dots
* selection outlines
* muted text
* grid visibility

---

# 60. Information Density

The UI direction is intentionally unresolved.

The design agent should explore at least three approaches:

## Writer's Desk

Characteristics:

* warm
* calm
* content-focused
* somewhat spacious
* subtle tactile qualities
* low visual noise

## Clean Studio

Characteristics:

* modern
* minimal
* polished
* neutral
* efficient
* medium information density

## Dense Workspace

Characteristics:

* compact
* high information density
* more visible controls
* powerful workspace feel
* suitable for very large projects

These should differ in more than colour.

They should explore different:

* navigation structures
* top bars
* panel placement
* board toolbars
* spacing
* information density
* inspector behaviour

---

# 61. Required Interaction States

Designs should not only show ideal populated screens.

At minimum, components should account for:

* Hover
* Focus
* Selected
* Editing
* Dragging
* Valid drop target
* Invalid drop target
* Disabled
* Empty
* Loading
* Error
* Linked note
* Unsaved note
* Deleted/trash state

---

# 62. Accessibility Expectations

MVP should aim for:

* keyboard-navigable common actions
* clear focus states
* readable font sizing
* reasonable colour contrast
* information not communicated by colour alone
* minimum practical click/drag targets
* light and dark mode readability

Canvas-heavy interactions may not be completely keyboard accessible in MVP, but standard application controls should be.

---

# 63. Explicit MVP Non-Goals

Do not design the MVP around:

* Collaboration
* User accounts
* Cloud sync
* Real-time multi-user editing
* Web version
* Android version
* Multiple Plot Line lanes
* Plot duration blocks
* Automated story analysis
* AI writing functionality
* Command palette
* Version history
* Automatic Info Map layout
* Complex connector routing
* Connector styling system
* Canvas rotation
* Templates marketplace
* Plugins
* Publishing workflows
* Writing statistics dashboards

The architecture may leave room for these features, but they should not consume meaningful MVP design surface.

---

# 64. Future Features Worth Leaving Room For

These are not MVP requirements.

### Cloud Sync

Projects may later synchronise across devices.

### Android Companion

Likely focuses on:

* viewing projects
* quickly creating notes
* editing notes
* browsing Notes boards

Complex Plot Line and Info Map editing may remain primarily desktop-oriented.

### Collaboration

Shared projects may eventually support multiple users.

The MVP should not expose collaboration controls.

### Backlinks

Internal note links may eventually support showing:

**Referenced by**

### Multiple Plot Threads

Plot Line boards may eventually support additional lanes.

Do not design this into MVP yet.

---

# 65. Primary User Flows

The design agent should validate designs against these flows.

## Start a project

Launch app
→ Create Project
→ choose location
→ enter name
→ Project Dashboard
→ create folder
→ create board

## Add a plot point

Open Plot Line
→ Add Plot Point
→ write note
→ assign categories
→ save
→ position point horizontally
→ adjust intensity vertically

## Rearrange plot pacing

Open Plot Line
→ collapse notes
→ zoom out
→ drag plot dots
→ immediately see overall tension/pacing distribution

## Create character map

Open Info Map
→ drag Note onto canvas
→ create character
→ drag Image onto canvas
→ create second character
→ connect characters
→ label relationship
→ group related items

## Organise research

Open Notes Board
→ create folders
→ create notes
→ tag notes
→ pin important notes
→ move notes between folders

## Reuse a note

Find existing note
→ duplicate/place in another context
→ linked copy created
→ edit either copy
→ changes appear everywhere

## Separate a reused note

Open linked note menu
→ Make Independent
→ confirm
→ note becomes independent
→ subsequent edits no longer propagate

## Find information

Open Global Search
→ type phrase
→ title results appear first
→ choose result
→ correct board opens
→ note opens

---

# 66. Product Success Test

The MVP is successful if a writer can comfortably:

1. Create a project.
2. Organise it into their own folder hierarchy.
3. Write and categorise notes.
4. Quickly find old information.
5. Build a visual relationship board.
6. Visually arrange the pacing of a story.
7. Reuse notes without unnecessary duplication.
8. Work completely offline.
9. Export their work so they retain ownership of it.
10. Understand the application without needing to learn a prescribed writing methodology.

The application should ultimately feel like a flexible personal writing workspace rather than a rigid writing framework.
