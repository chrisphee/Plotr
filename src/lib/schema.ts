/* TypeScript shapes for everything Plotr persists on disk.
   Every file carries schemaVersion for forward migration. */

export const SCHEMA_VERSION = 1;

export type BoardType = "plotline" | "infomap" | "notes";

/* ── project.json ── */

export interface Category {
  id: string;
  name: string;
  color: string; // css color, e.g. "oklch(0.55 0.18 300)" or "#7c5cbf"
}

export interface ProjectMeta {
  schemaVersion: number;
  id: string;
  name: string;
  description: string;
  coverImage: string | null; // project-relative "assets/…"
  /** Custom card colour on the Start screen; null = default ink. */
  color: string | null;
  genre: string;
  status: string;
  categories: Category[];
  createdAt: string;
  modifiedAt: string;
}

/* ── tree.json ── */

export interface TreeFolder {
  id: string;
  kind: "folder";
  name: string;
  parentId: string | null;
  order: number;
}

export interface TreeBoard {
  id: string;
  kind: "board";
  boardType: BoardType;
  name: string;
  parentId: string | null;
  order: number;
  description: string;
  icon: string | null;
  color: string | null;
}

export type TreeItem = TreeFolder | TreeBoard;

export interface TreeFile {
  schemaVersion: number;
  items: TreeItem[];
}

/* ── notes/note_*.json ── */

export interface Attachment {
  id: string;
  path: string; // project-relative "assets/…"
  fileName: string;
  size: number;
  mime: string;
}

export interface Note {
  schemaVersion: number;
  id: string;
  title: string;
  doc: unknown; // TipTap JSON document
  categoryIds: string[];
  color: string | null;
  attachments: Attachment[];
  createdAt: string;
  modifiedAt: string;
}

/* ── boards/brd_*.json ── */

export interface NotesBoardFolder {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
}

export interface NoteRef {
  id: string;
  noteId: string;
  folderId: string | null;
  order: number;
  pinned: boolean;
}

export interface NotesBoard {
  schemaVersion: number;
  id: string;
  type: "notes";
  folders: NotesBoardFolder[];
  noteRefs: NoteRef[];
  sort: { by: "manual" | "title" | "createdAt" | "modifiedAt"; dir: "asc" | "desc" };
}

export interface PlotPoint {
  id: string;
  noteId: string;
  x: number; // story position 0..1
  y: number; // intensity 0..1 (1 = high)
  expanded: boolean;
}

export interface PlotSection {
  id: string;
  name: string;
  start: number; // 0..1
  end: number;   // 0..1
}

export interface PlotLineBoard {
  schemaVersion: number;
  id: string;
  type: "plotline";
  points: PlotPoint[];
  sections: PlotSection[];
  view: { zoom: number; panX: number };
}

export type InfoMapItem =
  | { id: string; kind: "note"; noteId: string; x: number; y: number; w: number; h: number; parentId: string | null; z: number }
  | { id: string; kind: "image"; assetPath: string; x: number; y: number; w: number; h: number; parentId: string | null; z: number }
  | { id: string; kind: "text"; text: string; fontSize: number; x: number; y: number; w: number; h: number; parentId: string | null; z: number }
  | { id: string; kind: "group"; title: string; x: number; y: number; w: number; h: number; parentId: string | null; z: number };

export interface InfoMapConnection {
  id: string;
  from: string;
  to: string;
  /** Handle ids ("t" | "r" | "b" | "l") the user attached each end to. */
  fromHandle?: string | null;
  toHandle?: string | null;
  kind: "line" | "arrow";
  label: string;
}

export interface InfoMapBoard {
  schemaVersion: number;
  id: string;
  type: "infomap";
  items: InfoMapItem[];
  connections: InfoMapConnection[];
  view: { x: number; y: number; zoom: number };
}

export type Board = NotesBoard | PlotLineBoard | InfoMapBoard;

/* ── trash.json ── */

export interface TrashEntry {
  id: string;
  kind: "treeItem" | "noteRef" | "notesFolder" | "plotPoint" | "canvasItem";
  deletedAt: string;
  originPath: string[];
  displayName: string;
  boardId?: string;
  noteId?: string;
  payload: Record<string, unknown>;
}

export interface TrashFile {
  schemaVersion: number;
  entries: TrashEntry[];
}

/* ── helpers ── */

export function nowIso(): string {
  return new Date().toISOString();
}

export function emptyBoard(id: string, type: BoardType): Board {
  switch (type) {
    case "notes":
      return {
        schemaVersion: SCHEMA_VERSION, id, type,
        folders: [], noteRefs: [],
        sort: { by: "manual", dir: "asc" },
      };
    case "plotline":
      return {
        schemaVersion: SCHEMA_VERSION, id, type,
        points: [], sections: [],
        view: { zoom: 1, panX: 0 },
      };
    case "infomap":
      return {
        schemaVersion: SCHEMA_VERSION, id, type,
        items: [], connections: [],
        view: { x: 0, y: 0, zoom: 1 },
      };
  }
}

/** Quill category colour presets. */
export const CATEGORY_PRESETS: { name: string; color: string }[] = [
  { name: "Character", color: "#7c5cbf" },
  { name: "Location", color: "#3f9a5a" },
  { name: "Conflict", color: "#c8503f" },
  { name: "Lore", color: "#3b7dd8" },
];
