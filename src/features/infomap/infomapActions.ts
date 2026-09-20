import { useProject } from "../../stores/projectStore";
import { useNotes } from "../../stores/notesStore";
import { saveQueue } from "../../lib/saveQueue";
import { makeId } from "../../lib/ids";
import { undoStackFor } from "../../lib/undoStack";
import {
  nowIso,
  type InfoMapBoard,
  type InfoMapConnection,
  type InfoMapItem,
} from "../../lib/schema";

function mutate(boardId: string, fn: (b: InfoMapBoard) => InfoMapBoard) {
  useProject.getState().updateBoard(boardId, (b) => {
    if (b.type !== "infomap") return b;
    return fn(b);
  });
}

function getBoard(boardId: string): InfoMapBoard | null {
  const b = useProject.getState().boards[boardId];
  return b && b.type === "infomap" ? b : null;
}

function nextZ(boardId: string): number {
  const b = getBoard(boardId);
  return b ? Math.max(0, ...b.items.map((i) => i.z)) + 1 : 1;
}

/** Default creation sizes — also used for the drag-preview ghosts. */
export const ITEM_SIZES = {
  note: { w: 260, h: 160 },
  image: { w: 240, h: 180 },
  text: { w: 160, h: 44 },
  group: { w: 420, h: 300 },
} as const;

function pushAddUndo(boardId: string, item: InfoMapItem) {
  undoStackFor(boardId).push({
    label: `add ${item.kind}`,
    undo: () => mutate(boardId, (b) => ({ ...b, items: b.items.filter((i) => i.id !== item.id) })),
    redo: () => mutate(boardId, (b) => ({ ...b, items: [...b.items, item] })),
  });
}

export const infomap = {
  addNote(boardId: string, x: number, y: number): { itemId: string; noteId: string } {
    const note = useNotes.getState().createNote();
    const item: InfoMapItem = {
      id: makeId("it"), kind: "note", noteId: note.id,
      x, y, w: 260, h: 160, parentId: null, z: nextZ(boardId),
    };
    mutate(boardId, (b) => ({ ...b, items: [...b.items, item] }));
    pushAddUndo(boardId, item);
    return { itemId: item.id, noteId: note.id };
  },

  /** Linked copy of an existing note placed on the canvas. */
  addNoteRef(boardId: string, noteId: string, x: number, y: number): string {
    const item: InfoMapItem = {
      id: makeId("it"), kind: "note", noteId,
      x, y, w: 260, h: 160, parentId: null, z: nextZ(boardId),
    };
    mutate(boardId, (b) => ({ ...b, items: [...b.items, item] }));
    pushAddUndo(boardId, item);
    return item.id;
  },

  addImage(boardId: string, assetPath: string, x: number, y: number): string {
    const item: InfoMapItem = {
      id: makeId("it"), kind: "image", assetPath,
      x, y, w: 240, h: 180, parentId: null, z: nextZ(boardId),
    };
    mutate(boardId, (b) => ({ ...b, items: [...b.items, item] }));
    pushAddUndo(boardId, item);
    return item.id;
  },

  addText(boardId: string, x: number, y: number): string {
    const item: InfoMapItem = {
      id: makeId("it"), kind: "text", text: "Label", fontSize: 18,
      x, y, w: 160, h: 44, parentId: null, z: nextZ(boardId),
    };
    mutate(boardId, (b) => ({ ...b, items: [...b.items, item] }));
    pushAddUndo(boardId, item);
    return item.id;
  },

  addGroup(boardId: string, x: number, y: number): string {
    const item: InfoMapItem = {
      id: makeId("it"), kind: "group", title: "Group",
      x, y, w: 420, h: 300, parentId: null, z: 0,
    };
    mutate(boardId, (b) => ({ ...b, items: [...b.items, item] }));
    pushAddUndo(boardId, item);
    return item.id;
  },

  /** Live position update during drag — no undo entry. */
  setPosition(boardId: string, itemId: string, x: number, y: number) {
    mutate(boardId, (b) => ({
      ...b,
      items: b.items.map((i) => (i.id === itemId ? { ...i, x, y } : i)),
    }));
  },

  setSize(boardId: string, itemId: string, w: number, h: number, x?: number, y?: number) {
    mutate(boardId, (b) => ({
      ...b,
      items: b.items.map((i) =>
        i.id === itemId ? { ...i, w, h, x: x ?? i.x, y: y ?? i.y } : i,
      ),
    }));
  },

  recordMove(
    boardId: string,
    itemId: string,
    from: { x: number; y: number; parentId: string | null },
    to: { x: number; y: number; parentId: string | null },
  ) {
    if (from.x === to.x && from.y === to.y && from.parentId === to.parentId) return;
    undoStackFor(boardId).push({
      label: "move item",
      undo: () =>
        mutate(boardId, (b) => ({
          ...b,
          items: b.items.map((i) => (i.id === itemId ? { ...i, ...from } : i)),
        })),
      redo: () =>
        mutate(boardId, (b) => ({
          ...b,
          items: b.items.map((i) => (i.id === itemId ? { ...i, ...to } : i)),
        })),
    });
  },

  setParent(boardId: string, itemId: string, parentId: string | null, x: number, y: number) {
    mutate(boardId, (b) => ({
      ...b,
      items: b.items.map((i) => (i.id === itemId ? { ...i, parentId, x, y } : i)),
    }));
  },

  setText(boardId: string, itemId: string, text: string) {
    mutate(boardId, (b) => ({
      ...b,
      items: b.items.map((i) => (i.id === itemId && i.kind === "text" ? { ...i, text } : i)),
    }));
  },

  setGroupTitle(boardId: string, itemId: string, title: string) {
    mutate(boardId, (b) => ({
      ...b,
      items: b.items.map((i) => (i.id === itemId && i.kind === "group" ? { ...i, title } : i)),
    }));
  },

  /** Delete items (+ their connections). Note items leave a trash tombstone. */
  deleteItems(boardId: string, itemIds: string[]) {
    const board = getBoard(boardId);
    if (!board) return;
    const doomed = new Set(itemIds);
    // Children of deleted groups fall back to the canvas, keeping absolute pos.
    const removedItems = board.items.filter((i) => doomed.has(i.id));
    const removedConns = board.connections.filter(
      (c) => doomed.has(c.from) || doomed.has(c.to),
    );
    if (removedItems.length === 0 && removedConns.length === 0) return;

    const trashEntries = removedItems
      .filter((i) => i.kind === "note")
      .map((i) => ({
        id: makeId("tr"),
        kind: "canvasItem" as const,
        deletedAt: nowIso(),
        originPath: [],
        displayName:
          useNotes.getState().notes[(i as { noteId: string }).noteId]?.title || "Untitled note",
        boardId,
        noteId: (i as { noteId: string }).noteId,
        payload: { item: i },
      }));
    if (trashEntries.length > 0) {
      useProject.setState((s) => ({
        trash: { ...s.trash, entries: [...trashEntries, ...s.trash.entries] },
      }));
      persistTrash();
    }

    const reparented = board.items
      .filter((i) => !doomed.has(i.id) && i.parentId && doomed.has(i.parentId))
      .map((i) => i.id);

    mutate(boardId, (b) => {
      const groups = new Map(b.items.map((i) => [i.id, i]));
      return {
        ...b,
        items: b.items
          .filter((i) => !doomed.has(i.id))
          .map((i) => {
            if (i.parentId && doomed.has(i.parentId)) {
              const parent = groups.get(i.parentId);
              return {
                ...i,
                parentId: null,
                x: i.x + (parent?.x ?? 0),
                y: i.y + (parent?.y ?? 0),
              };
            }
            return i;
          }),
        connections: b.connections.filter((c) => !doomed.has(c.from) && !doomed.has(c.to)),
      };
    });

    undoStackFor(boardId).push({
      label: "delete items",
      undo: () => {
        mutate(boardId, (b) => ({
          ...b,
          items: [
            ...b.items.map((i) =>
              reparented.includes(i.id)
                ? removedItems.length
                  ? i // best effort: leave reparented children where they are
                  : i
                : i,
            ),
            ...removedItems,
          ],
          connections: [...b.connections, ...removedConns],
        }));
        if (trashEntries.length > 0) {
          const ids = new Set(trashEntries.map((t) => t.id));
          useProject.setState((s) => ({
            trash: { ...s.trash, entries: s.trash.entries.filter((e) => !ids.has(e.id)) },
          }));
          persistTrash();
        }
      },
      redo: () => this.deleteItems(boardId, itemIds),
    });
  },

  restoreCanvasEntry(entryId: string) {
    const s = useProject.getState();
    const entry = s.trash.entries.find((e) => e.id === entryId);
    if (!entry || entry.kind !== "canvasItem" || !entry.boardId) return;
    const item = (entry.payload as { item: InfoMapItem }).item;
    // Its group may be gone — restore at the canvas root in that case.
    const board = getBoard(entry.boardId);
    const parentOk = item.parentId && board?.items.some((i) => i.id === item.parentId);
    mutate(entry.boardId, (b) => ({
      ...b,
      items: [...b.items, parentOk ? item : { ...item, parentId: null }],
    }));
    useProject.setState((st) => ({
      trash: { ...st.trash, entries: st.trash.entries.filter((e) => e.id !== entryId) },
    }));
    persistTrash();
  },

  connect(
    boardId: string,
    from: string,
    to: string,
    kind: "line" | "arrow",
    fromHandle?: string | null,
    toHandle?: string | null,
  ): string {
    const conn: InfoMapConnection = {
      id: makeId("cn"),
      from,
      to,
      fromHandle: fromHandle ?? null,
      toHandle: toHandle ?? null,
      kind,
      label: "",
    };
    mutate(boardId, (b) => ({ ...b, connections: [...b.connections, conn] }));
    undoStackFor(boardId).push({
      label: "connect",
      undo: () =>
        mutate(boardId, (b) => ({
          ...b,
          connections: b.connections.filter((c) => c.id !== conn.id),
        })),
      redo: () => mutate(boardId, (b) => ({ ...b, connections: [...b.connections, conn] })),
    });
    return conn.id;
  },

  setConnectionLabel(boardId: string, connId: string, label: string) {
    mutate(boardId, (b) => ({
      ...b,
      connections: b.connections.map((c) => (c.id === connId ? { ...c, label } : c)),
    }));
  },

  deleteConnections(boardId: string, connIds: string[]) {
    const board = getBoard(boardId);
    if (!board) return;
    const doomed = new Set(connIds);
    const removed = board.connections.filter((c) => doomed.has(c.id));
    mutate(boardId, (b) => ({
      ...b,
      connections: b.connections.filter((c) => !doomed.has(c.id)),
    }));
    undoStackFor(boardId).push({
      label: "delete connection",
      undo: () => mutate(boardId, (b) => ({ ...b, connections: [...b.connections, ...removed] })),
      redo: () => this.deleteConnections(boardId, connIds),
    });
  },

  saveView(boardId: string, view: { x: number; y: number; zoom: number }) {
    mutate(boardId, (b) => ({ ...b, view }));
  },
};

function persistTrash() {
  const { projectPath } = useProject.getState();
  if (!projectPath) return;
  saveQueue.schedule(projectPath, "trash.json", () =>
    JSON.stringify(useProject.getState().trash, null, 2),
  );
}
