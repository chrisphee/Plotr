import { create } from "zustand";
import { SCHEMA_VERSION, nowIso, type Note } from "../lib/schema";
import { makeId } from "../lib/ids";
import { saveQueue } from "../lib/saveQueue";

/* The project-wide notes collection. Note content lives ONLY here; boards
   hold noteId references. That is the whole linked-copy mechanism: every
   card/dot/row renders from this store by id, so an edit anywhere updates
   every open view, and a note "appearing twice" is just two references. */

interface NotesState {
  projectPath: string | null;
  notes: Record<string, Note>;

  load: (projectPath: string, notes: Record<string, Note>) => void;
  clear: () => void;

  createNote: (init?: Partial<Pick<Note, "title" | "doc" | "categoryIds" | "color">>) => Note;
  updateNote: (
    noteId: string,
    patch: Partial<Pick<Note, "title" | "doc" | "categoryIds" | "color" | "attachments">>,
  ) => void;
  /** Deep-clone a note under a new id (the "Make Independent" primitive). */
  cloneNote: (noteId: string) => Note | null;
}

export const useNotes = create<NotesState>((set, get) => {
  const saveNote = (noteId: string) => {
    const { projectPath } = get();
    if (!projectPath) return;
    saveQueue.schedule(projectPath, `notes/${noteId}.json`, () =>
      JSON.stringify(get().notes[noteId], null, 2),
    );
  };

  return {
    projectPath: null,
    notes: {},

    load: (projectPath, notes) => set({ projectPath, notes }),
    clear: () => set({ projectPath: null, notes: {} }),

    createNote: (init) => {
      const note: Note = {
        schemaVersion: SCHEMA_VERSION,
        id: makeId("note"),
        title: init?.title ?? "",
        doc: init?.doc ?? { type: "doc", content: [{ type: "paragraph" }] },
        categoryIds: init?.categoryIds ?? [],
        color: init?.color ?? null,
        attachments: [],
        createdAt: nowIso(),
        modifiedAt: nowIso(),
      };
      set({ notes: { ...get().notes, [note.id]: note } });
      saveNote(note.id);
      return note;
    },

    updateNote: (noteId, patch) => {
      const note = get().notes[noteId];
      if (!note) return;
      set({
        notes: {
          ...get().notes,
          [noteId]: { ...note, ...patch, modifiedAt: nowIso() },
        },
      });
      saveNote(noteId);
    },

    cloneNote: (noteId) => {
      const source = get().notes[noteId];
      if (!source) return null;
      const clone: Note = {
        ...structuredClone(source),
        id: makeId("note"),
        createdAt: nowIso(),
        modifiedAt: nowIso(),
      };
      set({ notes: { ...get().notes, [clone.id]: clone } });
      saveNote(clone.id);
      return clone;
    },
  };
});

/** How many places reference this note across all boards. >1 = linked copy. */
export function refcountOf(
  noteId: string,
  boards: Record<string, import("../lib/schema").Board>,
): number {
  let n = 0;
  for (const board of Object.values(boards)) {
    switch (board.type) {
      case "notes":
        n += board.noteRefs.filter((r) => r.noteId === noteId).length;
        break;
      case "plotline":
        n += board.points.filter((p) => p.noteId === noteId).length;
        break;
      case "infomap":
        n += board.items.filter((i) => i.kind === "note" && i.noteId === noteId).length;
        break;
    }
  }
  return n;
}
