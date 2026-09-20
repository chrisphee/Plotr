import { create } from "zustand";
import MiniSearch from "minisearch";
import { useProject } from "../../stores/projectStore";
import { useNotes } from "../../stores/notesStore";
import { extractFullText } from "./fullText";
import type { Screen } from "../../app/navStore";

/* Project-wide search over notes (title + body + attachment names), boards,
   folders and categories. The index rebuilds lazily: any store change marks
   it dirty; the next query rebuilds. Projects are personal-scale, so a full
   rebuild stays comfortably fast. */

export interface SearchDoc {
  id: string;
  kind: "note" | "board" | "folder" | "category";
  title: string;
  body: string;
  /** Where it lives, e.g. "Worldbuilding › Characters › Main Cast". */
  location: string;
  /** Navigation target; notes also carry noteId for the popup. */
  screen: Screen | null;
  noteId?: string;
  categoryIds?: string[];
}

export interface SearchResult extends SearchDoc {
  score: number;
  titleMatch: boolean;
}

interface SearchState {
  overlayOpen: boolean;
  setOverlayOpen: (open: boolean) => void;
  query: (text: string, limit?: number) => SearchResult[];
  markDirty: () => void;
}

let index: MiniSearch<SearchDoc> | null = null;
let docs = new Map<string, SearchDoc>();
let dirty = true;

function treePath(parentId: string | null): string {
  return useProject
    .getState()
    .pathOf(parentId)
    .map((p) => p.name)
    .join(" › ");
}

function buildDocs(): SearchDoc[] {
  const project = useProject.getState();
  const notes = useNotes.getState().notes;
  const out: SearchDoc[] = [];

  // Where does each note appear? First location wins for display.
  const noteLocations = new Map<string, string[]>();
  for (const item of project.treeItems) {
    if (item.kind !== "board") continue;
    const board = project.boards[item.id];
    if (!board) continue;
    const boardPath = [treePath(item.parentId), item.name].filter(Boolean).join(" › ");
    if (board.type === "notes") {
      for (const ref of board.noteRefs) {
        const folder = board.folders.find((f) => f.id === ref.folderId);
        const loc = folder ? `${boardPath} › ${folder.name}` : boardPath;
        noteLocations.set(ref.noteId, [...(noteLocations.get(ref.noteId) ?? []), loc]);
      }
    } else if (board.type === "plotline") {
      for (const pt of board.points) {
        noteLocations.set(pt.noteId, [...(noteLocations.get(pt.noteId) ?? []), boardPath]);
      }
    } else {
      for (const it of board.items) {
        if (it.kind === "note") {
          noteLocations.set(it.noteId, [...(noteLocations.get(it.noteId) ?? []), boardPath]);
        }
      }
    }
  }

  for (const note of Object.values(notes)) {
    const locations = noteLocations.get(note.id) ?? [];
    const extra = locations.length > 1 ? `  +${locations.length - 1} more` : "";
    out.push({
      id: `note:${note.id}`,
      kind: "note",
      title: note.title || "Untitled note",
      body:
        extractFullText(note.doc) +
        " " +
        note.attachments.map((a) => a.fileName).join(" "),
      location: (locations[0] ?? "Not on any board") + extra,
      screen: null,
      noteId: note.id,
      categoryIds: note.categoryIds,
    });
  }

  for (const item of project.treeItems) {
    out.push({
      id: `tree:${item.id}`,
      kind: item.kind === "board" ? "board" : "folder",
      title: item.name,
      body: item.kind === "board" ? item.description : "",
      location: treePath(item.parentId) || "Project root",
      screen:
        item.kind === "board"
          ? { name: "board", boardId: item.id }
          : { name: "folder", folderId: item.id },
    });
  }

  for (const cat of project.meta?.categories ?? []) {
    out.push({
      id: `cat:${cat.id}`,
      kind: "category",
      title: cat.name,
      body: "",
      location: "Category",
      screen: { name: "projectSettings" },
    });
  }

  return out;
}

function rebuild() {
  const all = buildDocs();
  docs = new Map(all.map((d) => [d.id, d]));
  index = new MiniSearch<SearchDoc>({
    fields: ["title", "body"],
    storeFields: [],
    searchOptions: {
      boost: { title: 4 },
      prefix: true,
      fuzzy: 0.15,
    },
  });
  index.addAll(all);
  dirty = false;
}

export const useSearch = create<SearchState>((set) => ({
  overlayOpen: false,
  setOverlayOpen: (open) => set({ overlayOpen: open }),

  query: (text, limit = 30) => {
    if (!text.trim()) return [];
    if (dirty || !index) rebuild();
    const raw = index!.search(text);
    const q = text.toLowerCase();
    return raw
      .map((r) => {
        const doc = docs.get(String(r.id))!;
        return {
          ...doc,
          score: r.score,
          titleMatch: doc.title.toLowerCase().includes(q),
        };
      })
      .sort((a, b) => Number(b.titleMatch) - Number(a.titleMatch) || b.score - a.score)
      .slice(0, limit);
  },

  markDirty: () => {
    dirty = true;
  },
}));

// Any change to notes, tree or boards invalidates the index.
useNotes.subscribe(() => {
  dirty = true;
});
useProject.subscribe(() => {
  dirty = true;
});
