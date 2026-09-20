import { useProject } from "../../stores/projectStore";
import { useNotes } from "../../stores/notesStore";
import { saveQueue } from "../../lib/saveQueue";
import { makeId } from "../../lib/ids";
import { nowIso, type NoteRef, type NotesBoard, type NotesBoardFolder } from "../../lib/schema";

/* All mutations of a Notes board go through projectStore.updateBoard, which
   persists the board file. Note *content* mutations live in notesStore. */

function mutate(boardId: string, fn: (b: NotesBoard) => NotesBoard) {
  useProject.getState().updateBoard(boardId, (b) => {
    if (b.type !== "notes") return b;
    return fn(b);
  });
}

export const notesBoard = {
  createFolder(boardId: string, parentId: string | null, name: string): string {
    const id = makeId("nbf");
    mutate(boardId, (b) => ({
      ...b,
      folders: [
        ...b.folders,
        { id, name, parentId, order: b.folders.filter((f) => f.parentId === parentId).length },
      ],
    }));
    return id;
  },

  renameFolder(boardId: string, folderId: string, name: string) {
    mutate(boardId, (b) => ({
      ...b,
      folders: b.folders.map((f) => (f.id === folderId ? { ...f, name } : f)),
    }));
  },

  /** Delete a folder subtree; its refs and subfolders go to project trash. */
  deleteFolder(boardId: string, folderId: string) {
    const board = useProject.getState().boards[boardId];
    if (!board || board.type !== "notes") return;
    const doomed = new Set<string>([folderId]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const f of board.folders) {
        if (f.parentId && doomed.has(f.parentId) && !doomed.has(f.id)) {
          doomed.add(f.id);
          grew = true;
        }
      }
    }
    const folders = board.folders.filter((f) => doomed.has(f.id));
    const refs = board.noteRefs.filter((r) => r.folderId && doomed.has(r.folderId));
    const root = board.folders.find((f) => f.id === folderId);

    useProject.setState((s) => ({
      trash: {
        ...s.trash,
        entries: [
          {
            id: makeId("tr"),
            kind: "notesFolder" as const,
            deletedAt: nowIso(),
            originPath: [],
            displayName: root?.name ?? "Folder",
            boardId,
            payload: { folders, refs },
          },
          ...s.trash.entries,
        ],
      },
    }));
    persistTrash();
    mutate(boardId, (b) => ({
      ...b,
      folders: b.folders.filter((f) => !doomed.has(f.id)),
      noteRefs: b.noteRefs.filter((r) => !(r.folderId && doomed.has(r.folderId))),
    }));
  },

  /** Create a fresh note and reference it in the given folder. */
  createNote(boardId: string, folderId: string | null): { noteId: string; refId: string } {
    const note = useNotes.getState().createNote();
    const refId = this.addRef(boardId, folderId, note.id);
    return { noteId: note.id, refId };
  },

  /** Reference an existing note (a linked copy when it lives elsewhere too). */
  addRef(boardId: string, folderId: string | null, noteId: string): string {
    const id = makeId("ref");
    mutate(boardId, (b) => ({
      ...b,
      noteRefs: [
        ...b.noteRefs,
        {
          id,
          noteId,
          folderId,
          order: b.noteRefs.filter((r) => r.folderId === folderId).length,
          pinned: false,
        },
      ],
    }));
    return id;
  },

  moveRef(boardId: string, refId: string, folderId: string | null, order?: number) {
    mutate(boardId, (b) => {
      const moving = b.noteRefs.find((r) => r.id === refId);
      if (!moving) return b;
      const target = order ?? b.noteRefs.filter((r) => r.folderId === folderId).length;
      const refs = b.noteRefs.map((r) =>
        r.id === refId ? { ...r, folderId, order: target - 0.5 } : { ...r },
      );
      // Normalize order integers per folder.
      const siblings = refs
        .filter((r) => r.folderId === folderId)
        .sort((a, b2) => a.order - b2.order);
      siblings.forEach((r, i) => (r.order = i));
      return { ...b, noteRefs: refs };
    });
  },

  togglePin(boardId: string, refId: string) {
    mutate(boardId, (b) => ({
      ...b,
      noteRefs: b.noteRefs.map((r) => (r.id === refId ? { ...r, pinned: !r.pinned } : r)),
    }));
  },

  setSort(boardId: string, by: NotesBoard["sort"]["by"], dir: NotesBoard["sort"]["dir"]) {
    mutate(boardId, (b) => ({ ...b, sort: { by, dir } }));
  },

  /** Remove a reference (the note itself survives until Empty Trash GC). */
  deleteRef(boardId: string, refId: string) {
    const board = useProject.getState().boards[boardId];
    if (!board || board.type !== "notes") return;
    const ref = board.noteRefs.find((r) => r.id === refId);
    if (!ref) return;
    const note = useNotes.getState().notes[ref.noteId];

    useProject.setState((s) => ({
      trash: {
        ...s.trash,
        entries: [
          {
            id: makeId("tr"),
            kind: "noteRef" as const,
            deletedAt: nowIso(),
            originPath: [],
            displayName: note?.title || "Untitled note",
            boardId,
            noteId: ref.noteId,
            payload: { ref },
          },
          ...s.trash.entries,
        ],
      },
    }));
    persistTrash();
    mutate(boardId, (b) => ({ ...b, noteRefs: b.noteRefs.filter((r) => r.id !== refId) }));
  },

  /** Turn one linked reference into an independent note. */
  makeIndependent(boardId: string, refId: string): string | null {
    const board = useProject.getState().boards[boardId];
    if (!board || board.type !== "notes") return null;
    const ref = board.noteRefs.find((r) => r.id === refId);
    if (!ref) return null;
    const clone = useNotes.getState().cloneNote(ref.noteId);
    if (!clone) return null;
    mutate(boardId, (b) => ({
      ...b,
      noteRefs: b.noteRefs.map((r) => (r.id === refId ? { ...r, noteId: clone.id } : r)),
    }));
    return clone.id;
  },

  restoreFolderEntry(entryId: string) {
    const s = useProject.getState();
    const entry = s.trash.entries.find((e) => e.id === entryId);
    if (!entry || entry.kind !== "notesFolder" || !entry.boardId) return;
    const payload = entry.payload as { folders: NotesBoardFolder[]; refs: NoteRef[] };
    const board = s.boards[entry.boardId];
    if (board && board.type === "notes") {
      mutate(entry.boardId, (b) => {
        const existing = new Set(b.folders.map((f) => f.id));
        const restoredIds = new Set(payload.folders.map((f) => f.id));
        const folders = payload.folders.map((f) => ({
          ...f,
          parentId:
            f.parentId && !existing.has(f.parentId) && !restoredIds.has(f.parentId)
              ? null
              : f.parentId,
        }));
        return {
          ...b,
          folders: [...b.folders, ...folders],
          noteRefs: [...b.noteRefs, ...payload.refs],
        };
      });
    }
    removeTrashEntry(entryId);
  },

  restoreRefEntry(entryId: string) {
    const s = useProject.getState();
    const entry = s.trash.entries.find((e) => e.id === entryId);
    if (!entry || entry.kind !== "noteRef" || !entry.boardId) return;
    const payload = entry.payload as { ref: NoteRef };
    const board = s.boards[entry.boardId];
    if (board && board.type === "notes") {
      mutate(entry.boardId, (b) => {
        const folderExists =
          payload.ref.folderId === null || b.folders.some((f) => f.id === payload.ref.folderId);
        return {
          ...b,
          noteRefs: [
            ...b.noteRefs,
            { ...payload.ref, folderId: folderExists ? payload.ref.folderId : null },
          ],
        };
      });
    }
    removeTrashEntry(entryId);
  },
};

function removeTrashEntry(entryId: string) {
  useProject.setState((s) => ({
    trash: { ...s.trash, entries: s.trash.entries.filter((e) => e.id !== entryId) },
  }));
  persistTrash();
}

function persistTrash() {
  const { projectPath } = useProject.getState();
  if (!projectPath) return;
  saveQueue.schedule(projectPath, "trash.json", () =>
    JSON.stringify(useProject.getState().trash, null, 2),
  );
}
