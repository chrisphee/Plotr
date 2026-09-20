import { create } from "zustand";
import {
  SCHEMA_VERSION,
  nowIso,
  emptyBoard,
  CATEGORY_PRESETS,
  type Board,
  type BoardType,
  type Note,
  type ProjectMeta,
  type TrashFile,
  type TreeBoard,
  type TreeFolder,
  type TreeItem,
} from "../lib/schema";
import { makeId } from "../lib/ids";
import { saveQueue } from "../lib/saveQueue";
import * as tauri from "../tauri/commands";
import { useSettings } from "./settingsStore";
import { useNotes } from "./notesStore";
import { useNav } from "../app/navStore";

interface ProjectState {
  projectPath: string | null;
  meta: ProjectMeta | null;
  treeItems: TreeItem[];
  boards: Record<string, Board>;
  trash: TrashFile;

  createAndOpen: (parentDir: string, name: string, description: string) => Promise<void>;
  open: (path: string) => Promise<void>;
  close: () => Promise<void>;

  updateMeta: (patch: Partial<Omit<ProjectMeta, "schemaVersion" | "id" | "createdAt">>) => void;
  createFolder: (parentId: string | null, name: string) => string;
  createBoard: (
    parentId: string | null,
    boardType: BoardType,
    name: string,
    description: string,
  ) => Promise<string>;
  renameTreeItem: (id: string, name: string) => void;
  /** Update one board immutably and schedule its file save. */
  updateBoard: (boardId: string, updater: (b: Board) => Board) => void;
  addCategory: (name: string, color: string) => string;
  updateCategory: (id: string, patch: { name?: string; color?: string }) => void;
  deleteCategory: (id: string) => void;
  moveTreeItem: (id: string, parentId: string | null, order: number) => void;
  deleteTreeItem: (id: string) => void;
  restoreTrashEntry: (entryId: string) => void;

  childrenOf: (parentId: string | null) => TreeItem[];
  pathOf: (id: string | null) => TreeItem[];
}

function serializeTree(items: TreeItem[]): string {
  return JSON.stringify({ schemaVersion: SCHEMA_VERSION, items }, null, 2);
}

function sortSiblings(items: TreeItem[]): TreeItem[] {
  return [...items].sort((a, b) =>
    a.order - b.order || a.name.localeCompare(b.name),
  );
}

export const useProject = create<ProjectState>((set, get) => {
  /* Persistence helpers: always serialize from the *current* store state so
     debounced writes never capture stale snapshots. */
  const saveTree = () => {
    const { projectPath } = get();
    if (!projectPath) return;
    saveQueue.schedule(projectPath, "tree.json", () => serializeTree(get().treeItems));
  };
  const saveMeta = () => {
    const { projectPath } = get();
    if (!projectPath) return;
    saveQueue.schedule(projectPath, "project.json", () =>
      JSON.stringify(get().meta, null, 2),
    );
  };
  const saveTrash = () => {
    const { projectPath } = get();
    if (!projectPath) return;
    saveQueue.schedule(projectPath, "trash.json", () =>
      JSON.stringify(get().trash, null, 2),
    );
  };
  const touchMeta = () => {
    const meta = get().meta;
    if (!meta) return;
    set({ meta: { ...meta, modifiedAt: nowIso() } });
    saveMeta();
  };

  return {
    projectPath: null,
    meta: null,
    treeItems: [],
    boards: {},
    trash: { schemaVersion: SCHEMA_VERSION, entries: [] },

    createAndOpen: async (parentDir, name, description) => {
      const meta: ProjectMeta = {
        schemaVersion: SCHEMA_VERSION,
        id: makeId("prj"),
        name,
        description,
        coverImage: null,
        color: null,
        genre: "",
        status: "",
        categories: CATEGORY_PRESETS.map((p) => ({
          id: makeId("cat"),
          name: p.name,
          color: p.color,
        })),
        createdAt: nowIso(),
        modifiedAt: nowIso(),
      };
      const path = await tauri.createProject(
        parentDir,
        name,
        JSON.stringify(meta, null, 2),
        serializeTree([]),
      );
      await get().open(path);
    },

    open: async (path) => {
      const bundle = await tauri.loadProject(path);
      const parsedMeta = JSON.parse(bundle.project) as ProjectMeta;
      // Fields added after schemaVersion 1 files were written default here.
      const meta: ProjectMeta = {
        ...parsedMeta,
        coverImage: parsedMeta.coverImage ?? null,
        color: parsedMeta.color ?? null,
      };
      const tree = JSON.parse(bundle.tree) as { items: TreeItem[] };
      const trash = JSON.parse(bundle.trash) as TrashFile;
      const notes: Record<string, Note> = {};
      for (const raw of bundle.notes) {
        const n = JSON.parse(raw) as Note;
        notes[n.id] = n;
      }
      const boards: Record<string, Board> = {};
      for (const raw of bundle.boards) {
        const b = JSON.parse(raw) as Board;
        boards[b.id] = b;
      }
      set({
        projectPath: bundle.project_path,
        meta,
        treeItems: tree.items,
        boards,
        trash,
      });
      useNotes.getState().load(bundle.project_path, notes);
      useSettings.getState().touchRecent(bundle.project_path, meta.name, {
        coverImage: meta.coverImage,
        color: meta.color,
      });
      useNav.getState().reset({ name: "dashboard" });
    },

    close: async () => {
      await saveQueue.flush();
      useNotes.getState().clear();
      set({
        projectPath: null,
        meta: null,
        treeItems: [],
        boards: {},
        trash: { schemaVersion: SCHEMA_VERSION, entries: [] },
      });
      useNav.getState().reset({ name: "start" });
    },

    updateBoard: (boardId, updater) => {
      const board = get().boards[boardId];
      if (!board) return;
      set({ boards: { ...get().boards, [boardId]: updater(board) } });
      const { projectPath } = get();
      if (projectPath) {
        saveQueue.schedule(projectPath, `boards/${boardId}.json`, () =>
          JSON.stringify(get().boards[boardId], null, 2),
        );
      }
      touchMeta();
    },

    addCategory: (name, color) => {
      const meta = get().meta;
      if (!meta) return "";
      const id = makeId("cat");
      set({
        meta: {
          ...meta,
          categories: [...meta.categories, { id, name, color }],
          modifiedAt: nowIso(),
        },
      });
      saveMeta();
      return id;
    },

    updateCategory: (id, patch) => {
      const meta = get().meta;
      if (!meta) return;
      set({
        meta: {
          ...meta,
          categories: meta.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          modifiedAt: nowIso(),
        },
      });
      saveMeta();
    },

    deleteCategory: (id) => {
      const meta = get().meta;
      if (!meta) return;
      set({
        meta: {
          ...meta,
          categories: meta.categories.filter((c) => c.id !== id),
          modifiedAt: nowIso(),
        },
      });
      saveMeta();
      // Notes referencing the category drop it lazily when next saved; the
      // UI resolves ids against meta.categories so a stale id renders nothing.
    },

    updateMeta: (patch) => {
      const meta = get().meta;
      if (!meta) return;
      const next = { ...meta, ...patch, modifiedAt: nowIso() };
      set({ meta: next });
      saveMeta();
      // Keep the Start screen's card snapshot in sync.
      const { projectPath } = get();
      if (projectPath) {
        useSettings.getState().touchRecent(projectPath, next.name, {
          coverImage: next.coverImage,
          color: next.color,
        });
      }
    },

    createFolder: (parentId, name) => {
      const id = makeId("fld");
      const siblings = get().childrenOf(parentId);
      const folder: TreeFolder = {
        id,
        kind: "folder",
        name,
        parentId,
        order: siblings.length,
      };
      set({ treeItems: [...get().treeItems, folder] });
      saveTree();
      touchMeta();
      return id;
    },

    createBoard: async (parentId, boardType, name, description) => {
      const id = makeId("brd");
      const siblings = get().childrenOf(parentId);
      const item: TreeBoard = {
        id,
        kind: "board",
        boardType,
        name,
        parentId,
        order: siblings.length,
        description,
        icon: null,
        color: null,
      };
      const board = emptyBoard(id, boardType);
      set({
        treeItems: [...get().treeItems, item],
        boards: { ...get().boards, [id]: board },
      });
      const { projectPath } = get();
      if (projectPath) {
        // Board file is written immediately so the project folder never
        // references a board that does not exist on disk.
        await tauri.writeProjectFile(
          projectPath,
          `boards/${id}.json`,
          JSON.stringify(board, null, 2),
        );
      }
      saveTree();
      touchMeta();
      return id;
    },

    renameTreeItem: (id, name) => {
      set({
        treeItems: get().treeItems.map((it) => (it.id === id ? { ...it, name } : it)),
      });
      saveTree();
      touchMeta();
    },

    moveTreeItem: (id, parentId, order) => {
      const items = get().treeItems.map((it) => ({ ...it }));
      const moving = items.find((it) => it.id === id);
      if (!moving) return;
      // Prevent dropping a folder into its own subtree.
      let cursor: string | null = parentId;
      while (cursor) {
        if (cursor === id) return;
        cursor = items.find((it) => it.id === cursor)?.parentId ?? null;
      }
      moving.parentId = parentId;
      moving.order = order - 0.5;
      // Normalize sibling order to integers.
      const siblings = sortSiblings(items.filter((it) => it.parentId === parentId));
      siblings.forEach((it, i) => (it.order = i));
      set({ treeItems: items });
      saveTree();
      touchMeta();
    },

    deleteTreeItem: (id) => {
      const all = get().treeItems;
      const root = all.find((it) => it.id === id);
      if (!root) return;
      // Collect the whole subtree into a tombstone; board/note files stay on
      // disk until Empty Trash garbage-collects them.
      const doomed = new Set<string>([id]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const it of all) {
          if (it.parentId && doomed.has(it.parentId) && !doomed.has(it.id)) {
            doomed.add(it.id);
            grew = true;
          }
        }
      }
      const removed = all.filter((it) => doomed.has(it.id));
      const entry = {
        id: makeId("tr"),
        kind: "treeItem" as const,
        deletedAt: nowIso(),
        originPath: get()
          .pathOf(root.parentId)
          .map((p) => p.name),
        displayName: root.name,
        payload: { treeItems: removed },
      };
      set({
        treeItems: all.filter((it) => !doomed.has(it.id)),
        trash: { ...get().trash, entries: [entry, ...get().trash.entries] },
      });
      saveTree();
      saveTrash();
      touchMeta();
    },

    restoreTrashEntry: (entryId) => {
      const entry = get().trash.entries.find((e) => e.id === entryId);
      if (!entry || entry.kind !== "treeItem") return;
      const restored = (entry.payload.treeItems as TreeItem[]).map((it) => ({ ...it }));
      const existing = new Set(get().treeItems.map((it) => it.id));
      const restoredIds = new Set(restored.map((it) => it.id));
      // If the original parent is gone, restore to the project root.
      for (const it of restored) {
        if (it.parentId && !existing.has(it.parentId) && !restoredIds.has(it.parentId)) {
          it.parentId = null;
        }
      }
      set({
        treeItems: [...get().treeItems, ...restored],
        trash: {
          ...get().trash,
          entries: get().trash.entries.filter((e) => e.id !== entryId),
        },
      });
      saveTree();
      saveTrash();
      touchMeta();
    },

    childrenOf: (parentId) =>
      sortSiblings(get().treeItems.filter((it) => it.parentId === parentId)),

    pathOf: (id) => {
      const items = get().treeItems;
      const path: TreeItem[] = [];
      let cursor = id;
      while (cursor) {
        const item = items.find((it) => it.id === cursor);
        if (!item) break;
        path.unshift(item);
        cursor = item.parentId;
      }
      return path;
    },
  };
});
