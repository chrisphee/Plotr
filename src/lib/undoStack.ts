/* Per-board undo/redo for structural operations (moves, creates, deletes).
   Each entry is a pair of inverse thunks. Text editing inside TipTap uses
   the editor's own history and never goes through this. */

export interface UndoEntry {
  label: string;
  undo: () => void;
  redo: () => void;
}

export class UndoStack {
  private done: UndoEntry[] = [];
  private undone: UndoEntry[] = [];
  private limit = 100;

  push(entry: UndoEntry) {
    this.done.push(entry);
    if (this.done.length > this.limit) this.done.shift();
    this.undone = [];
  }

  undo(): boolean {
    const entry = this.done.pop();
    if (!entry) return false;
    entry.undo();
    this.undone.push(entry);
    return true;
  }

  redo(): boolean {
    const entry = this.undone.pop();
    if (!entry) return false;
    entry.redo();
    this.done.push(entry);
    return true;
  }
}

const stacks = new Map<string, UndoStack>();

export function undoStackFor(boardId: string): UndoStack {
  let s = stacks.get(boardId);
  if (!s) {
    s = new UndoStack();
    stacks.set(boardId, s);
  }
  return s;
}
