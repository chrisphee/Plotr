import { create } from "zustand";

/* Global "which note popup is open" state. The popup host lives in App so a
   note can open from any screen (boards, search, wiki-links). Only one note
   is open at a time — links from inside a note replace the current one. */

interface NoteModalState {
  noteId: string | null;
  mode: "read" | "edit";
  /** The notes-board ref that opened this popup, if any (for board actions). */
  contextRefId: string | null;
  contextBoardId: string | null;
  open: (noteId: string, mode?: "read" | "edit", context?: { boardId: string; refId: string }) => void;
  setMode: (mode: "read" | "edit") => void;
  close: () => void;
}

export const useNoteModal = create<NoteModalState>((set) => ({
  noteId: null,
  mode: "read",
  contextRefId: null,
  contextBoardId: null,
  open: (noteId, mode = "read", context) =>
    set({
      noteId,
      mode,
      contextBoardId: context?.boardId ?? null,
      contextRefId: context?.refId ?? null,
    }),
  setMode: (mode) => set({ mode }),
  close: () => set({ noteId: null, contextBoardId: null, contextRefId: null }),
}));
