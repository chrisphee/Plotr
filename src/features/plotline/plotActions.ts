import { useProject } from "../../stores/projectStore";
import { useNotes } from "../../stores/notesStore";
import { saveQueue } from "../../lib/saveQueue";
import { makeId } from "../../lib/ids";
import { undoStackFor } from "../../lib/undoStack";
import { nowIso, type PlotLineBoard, type PlotPoint, type PlotSection } from "../../lib/schema";

function mutate(boardId: string, fn: (b: PlotLineBoard) => PlotLineBoard) {
  useProject.getState().updateBoard(boardId, (b) => {
    if (b.type !== "plotline") return b;
    return fn(b);
  });
}

function getBoard(boardId: string): PlotLineBoard | null {
  const b = useProject.getState().boards[boardId];
  return b && b.type === "plotline" ? b : null;
}

export const plotline = {
  /** Create a note + point. Returns ids; undoable. */
  addPoint(boardId: string, x: number, y: number): { pointId: string; noteId: string } {
    const note = useNotes.getState().createNote();
    const pointId = makeId("pt");
    const point: PlotPoint = { id: pointId, noteId: note.id, x, y, expanded: false };
    mutate(boardId, (b) => ({ ...b, points: [...b.points, point] }));
    undoStackFor(boardId).push({
      label: "add plot point",
      undo: () => mutate(boardId, (b) => ({ ...b, points: b.points.filter((p) => p.id !== pointId) })),
      redo: () => mutate(boardId, (b) => ({ ...b, points: [...b.points, point] })),
    });
    return { pointId, noteId: note.id };
  },

  /** Live drag update — no undo entry (recordMove handles that on release). */
  movePoint(boardId: string, pointId: string, x: number, y: number) {
    const cx = Math.min(1, Math.max(0, x));
    const cy = Math.min(1, Math.max(0, y));
    mutate(boardId, (b) => ({
      ...b,
      points: b.points.map((p) => (p.id === pointId ? { ...p, x: cx, y: cy } : p)),
    }));
  },

  /** Push one undo entry for a completed drag. */
  recordMove(boardId: string, pointId: string, from: { x: number; y: number }, to: { x: number; y: number }) {
    if (from.x === to.x && from.y === to.y) return;
    undoStackFor(boardId).push({
      label: "move plot point",
      undo: () => this.movePoint(boardId, pointId, from.x, from.y),
      redo: () => this.movePoint(boardId, pointId, to.x, to.y),
    });
  },

  setExpanded(boardId: string, pointId: string, expanded: boolean) {
    mutate(boardId, (b) => ({
      ...b,
      points: b.points.map((p) => (p.id === pointId ? { ...p, expanded } : p)),
    }));
  },

  setAllExpanded(boardId: string, expanded: boolean) {
    mutate(boardId, (b) => ({ ...b, points: b.points.map((p) => ({ ...p, expanded })) }));
  },

  /** Remove a point; the reference goes to project trash (undoable too). */
  deletePoint(boardId: string, pointId: string) {
    const board = getBoard(boardId);
    const point = board?.points.find((p) => p.id === pointId);
    if (!board || !point) return;
    const note = useNotes.getState().notes[point.noteId];

    const entryId = makeId("tr");
    useProject.setState((s) => ({
      trash: {
        ...s.trash,
        entries: [
          {
            id: entryId,
            kind: "plotPoint" as const,
            deletedAt: nowIso(),
            originPath: [],
            displayName: note?.title || "Untitled note",
            boardId,
            noteId: point.noteId,
            payload: { point },
          },
          ...s.trash.entries,
        ],
      },
    }));
    persistTrash();
    mutate(boardId, (b) => ({ ...b, points: b.points.filter((p) => p.id !== pointId) }));

    undoStackFor(boardId).push({
      label: "delete plot point",
      undo: () => {
        mutate(boardId, (b) => ({ ...b, points: [...b.points, point] }));
        useProject.setState((s) => ({
          trash: { ...s.trash, entries: s.trash.entries.filter((e) => e.id !== entryId) },
        }));
        persistTrash();
      },
      redo: () => this.deletePoint(boardId, pointId),
    });
  },

  restorePointEntry(entryId: string) {
    const s = useProject.getState();
    const entry = s.trash.entries.find((e) => e.id === entryId);
    if (!entry || entry.kind !== "plotPoint" || !entry.boardId) return;
    const point = (entry.payload as { point: PlotPoint }).point;
    mutate(entry.boardId, (b) => ({ ...b, points: [...b.points, point] }));
    useProject.setState((st) => ({
      trash: { ...st.trash, entries: st.trash.entries.filter((e) => e.id !== entryId) },
    }));
    persistTrash();
  },

  addSection(boardId: string, name: string, start: number, end: number): string {
    const id = makeId("sec");
    const section: PlotSection = { id, name, start, end };
    mutate(boardId, (b) => ({ ...b, sections: [...b.sections, section] }));
    return id;
  },

  updateSection(boardId: string, sectionId: string, patch: Partial<Omit<PlotSection, "id">>) {
    mutate(boardId, (b) => ({
      ...b,
      sections: b.sections.map((sec) => (sec.id === sectionId ? { ...sec, ...patch } : sec)),
    }));
  },

  deleteSection(boardId: string, sectionId: string) {
    mutate(boardId, (b) => ({
      ...b,
      sections: b.sections.filter((sec) => sec.id !== sectionId),
    }));
  },

  saveView(boardId: string, view: { zoom: number; panX: number }) {
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
