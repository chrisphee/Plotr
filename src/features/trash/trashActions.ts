import { useProject } from "../../stores/projectStore";
import { useNotes } from "../../stores/notesStore";
import { saveQueue } from "../../lib/saveQueue";
import { deleteProjectFile, listProjectFiles } from "../../tauri/commands";
import type { NoteRef, TreeItem } from "../../lib/schema";

/* Permanent deletion. Files on disk are only ever removed here, after
   computing what is still reachable from the tree, boards, notes and the
   remaining (restorable) trash entries. */

function persistTrash() {
  const { projectPath } = useProject.getState();
  if (!projectPath) return;
  saveQueue.schedule(projectPath, "trash.json", () =>
    JSON.stringify(useProject.getState().trash, null, 2),
  );
}

/** Note ids reachable from live boards or restorable trash entries. */
function reachableNoteIds(): Set<string> {
  const s = useProject.getState();
  const ids = new Set<string>();
  const liveBoardIds = new Set(
    s.treeItems.filter((t) => t.kind === "board").map((t) => t.id),
  );
  // Boards inside trash tombstones are restorable → their notes stay reachable.
  for (const entry of s.trash.entries) {
    if (entry.kind === "treeItem") {
      for (const it of (entry.payload.treeItems as TreeItem[]) ?? []) {
        if (it.kind === "board") liveBoardIds.add(it.id);
      }
    }
    if (entry.kind === "noteRef" && entry.noteId) ids.add(entry.noteId);
    if (entry.kind === "notesFolder") {
      for (const ref of (entry.payload.refs as NoteRef[]) ?? []) ids.add(ref.noteId);
    }
  }
  for (const [boardId, board] of Object.entries(s.boards)) {
    if (!liveBoardIds.has(boardId)) continue;
    switch (board.type) {
      case "notes":
        board.noteRefs.forEach((r) => ids.add(r.noteId));
        break;
      case "plotline":
        board.points.forEach((p) => ids.add(p.noteId));
        break;
      case "infomap":
        board.items.forEach((i) => i.kind === "note" && ids.add(i.noteId));
        break;
    }
  }
  return ids;
}

/** Asset paths referenced by reachable notes, boards and project meta. */
function reachableAssets(reachableNotes: Set<string>): Set<string> {
  const s = useProject.getState();
  const notes = useNotes.getState().notes;
  const assets = new Set<string>();
  if (s.meta?.coverImage) assets.add(s.meta.coverImage);

  const walkDoc = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const n = node as { type?: string; attrs?: { src?: string }; content?: unknown[] };
    if (n.type === "image" && typeof n.attrs?.src === "string" && n.attrs.src.startsWith("assets/")) {
      assets.add(n.attrs.src);
    }
    n.content?.forEach(walkDoc);
  };

  for (const note of Object.values(notes)) {
    if (!reachableNotes.has(note.id)) continue;
    note.attachments.forEach((a) => assets.add(a.path));
    walkDoc(note.doc);
  }
  for (const board of Object.values(s.boards)) {
    if (board.type === "infomap") {
      board.items.forEach((i) => {
        if (i.kind === "image") assets.add(i.assetPath);
      });
    }
  }
  return assets;
}

/** Delete every file no longer reachable. Runs after entries are removed. */
async function garbageCollect() {
  const s = useProject.getState();
  const { projectPath } = s;
  if (!projectPath) return;
  await saveQueue.flush();

  // Boards: live in tree, or restorable from a trash tombstone.
  const keepBoards = new Set(s.treeItems.filter((t) => t.kind === "board").map((t) => t.id));
  for (const entry of s.trash.entries) {
    if (entry.kind === "treeItem") {
      for (const it of (entry.payload.treeItems as TreeItem[]) ?? []) {
        if (it.kind === "board") keepBoards.add(it.id);
      }
    }
  }
  for (const file of await listProjectFiles(projectPath, "boards")) {
    const id = file.replace(/\.json$/, "");
    if (!keepBoards.has(id)) {
      await deleteProjectFile(projectPath, `boards/${file}`);
    }
  }
  // Drop purged boards from memory too.
  useProject.setState((st) => ({
    boards: Object.fromEntries(
      Object.entries(st.boards).filter(([id]) => keepBoards.has(id)),
    ),
  }));

  const keepNotes = reachableNoteIds();
  for (const file of await listProjectFiles(projectPath, "notes")) {
    const id = file.replace(/\.json$/, "");
    if (!keepNotes.has(id)) {
      await deleteProjectFile(projectPath, `notes/${file}`);
    }
  }
  useNotes.setState((st) => ({
    notes: Object.fromEntries(Object.entries(st.notes).filter(([id]) => keepNotes.has(id))),
  }));

  const keepAssets = reachableAssets(keepNotes);
  for (const file of await listProjectFiles(projectPath, "assets")) {
    if (!keepAssets.has(`assets/${file}`)) {
      await deleteProjectFile(projectPath, `assets/${file}`);
    }
  }
}

export async function purgeTrashEntry(entryId: string) {
  useProject.setState((s) => ({
    trash: { ...s.trash, entries: s.trash.entries.filter((e) => e.id !== entryId) },
  }));
  persistTrash();
  await garbageCollect();
}

export async function emptyTrash() {
  useProject.setState((s) => ({ trash: { ...s.trash, entries: [] } }));
  persistTrash();
  await garbageCollect();
}
