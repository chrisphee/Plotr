import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronRight,
  Copy,
  FilePlus2,
  Folder,
  FolderPlus,
  Inbox,
  Link2,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Scissors,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import { useProject } from "../../stores/projectStore";
import { useNotes, refcountOf } from "../../stores/notesStore";
import { useNoteModal } from "../note-editor/noteModalStore";
import { notesBoard } from "./notesBoardActions";
import type { NoteRef, NotesBoard, NotesBoardFolder, TreeBoard } from "../../lib/schema";
import { Dock } from "../../components/shell/Dock";
import { Button, IconButton } from "../../components/ui/Button";
import { TextInput } from "../../components/ui/Field";
import { Menu, MenuItem, MenuSeparator, type MenuPosition } from "../../components/ui/Menu";
import { ConfirmDialog } from "../../components/ui/Modal";
import { RenameModal } from "../dashboard/RenameModal";
import { CategoryDot } from "../../components/ui/CategoryChip";
import { EmptyState } from "../../components/ui/EmptyState";
import { extractPreview } from "./preview";
import "./notesBoard.css";

export function NotesBoardScreen({ treeItem }: { treeItem: TreeBoard }) {
  const board = useProject((s) => s.boards[treeItem.id]) as NotesBoard | undefined;
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [dragRefId, setDragRefId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  if (!board) return null;

  const onDragEnd = (e: DragEndEvent) => {
    setDragRefId(null);
    const refId = e.active.data.current?.refId as string | undefined;
    const target = e.over?.data.current as
      | { folderId: string | null; kind: "folder" }
      | undefined;
    if (refId && target && target.kind === "folder") {
      notesBoard.moveRef(board.id, refId, target.folderId);
    }
  };

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <DndContext
        sensors={sensors}
        onDragStart={(e) => setDragRefId(e.active.data.current?.refId ?? null)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragRefId(null)}
      >
        <div className="nb">
          <FolderTreePane
            board={board}
            boardName={treeItem.name}
            activeFolderId={activeFolderId}
            onSelect={setActiveFolderId}
          />
          <NoteListPane
            board={board}
            activeFolderId={activeFolderId}
            filter={filter}
            setFilter={setFilter}
          />
        </div>
        <DragOverlay>
          {dragRefId && <DragPreview board={board} refId={dragRefId} />}
        </DragOverlay>
      </DndContext>
      <Dock
        actions={
          <>
            <IconButton
              onInk
              label="New note"
              onClick={() => {
                const { noteId } = notesBoard.createNote(board.id, activeFolderId);
                useNoteModal.getState().open(noteId, "edit");
              }}
            >
              <FilePlus2 size={15} />
            </IconButton>
          </>
        }
      />
    </div>
  );
}

/* ── Folder tree ── */

function FolderTreePane({
  board,
  boardName,
  activeFolderId,
  onSelect,
}: {
  board: NotesBoard;
  boardName: string;
  activeFolderId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [creating, setCreating] = useState<{ parentId: string | null } | null>(null);

  const roots = board.folders
    .filter((f) => f.parentId === null)
    .sort((a, b) => a.order - b.order);

  return (
    <aside className="nb__tree">
      <div className="nb__boardname">{boardName}</div>
      <AllNotesRow board={board} active={activeFolderId === null} onSelect={() => onSelect(null)} />
      {roots.map((f) => (
        <FolderNode
          key={f.id}
          board={board}
          folder={f}
          depth={0}
          activeFolderId={activeFolderId}
          onSelect={onSelect}
          onNewSubfolder={(parentId) => setCreating({ parentId })}
        />
      ))}
      <div className="nb__treefoot">
        <Button variant="ghost" onClick={() => setCreating({ parentId: null })}>
          <FolderPlus size={14} /> New folder
        </Button>
      </div>
      {creating && (
        <RenameModal
          item={null}
          title="New Folder"
          confirmLabel="Create"
          placeholder="Main Cast"
          onSubmit={(name) => notesBoard.createFolder(board.id, creating.parentId, name)}
          onClose={() => setCreating(null)}
        />
      )}
    </aside>
  );
}

function AllNotesRow({
  board,
  active,
  onSelect,
}: {
  board: NotesBoard;
  active: boolean;
  onSelect: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: "folder-root",
    data: { kind: "folder", folderId: null },
  });
  return (
    <button
      ref={setNodeRef}
      className={clsx("nb-folder", active && "nb-folder--active", isOver && "nb-folder--droptarget")}
      onClick={onSelect}
    >
      <Inbox size={14} /> All notes
      <span className="nb-folder__count">{board.noteRefs.length}</span>
    </button>
  );
}

function FolderNode({
  board,
  folder,
  depth,
  activeFolderId,
  onSelect,
  onNewSubfolder,
}: {
  board: NotesBoard;
  folder: NotesBoardFolder;
  depth: number;
  activeFolderId: string | null;
  onSelect: (id: string | null) => void;
  onNewSubfolder: (parentId: string) => void;
}) {
  const [menu, setMenu] = useState<MenuPosition | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${folder.id}`,
    data: { kind: "folder", folderId: folder.id },
  });

  const children = board.folders
    .filter((f) => f.parentId === folder.id)
    .sort((a, b) => a.order - b.order);
  const count = board.noteRefs.filter((r) => r.folderId === folder.id).length;

  return (
    <>
      <button
        ref={setNodeRef}
        className={clsx(
          "nb-folder",
          activeFolderId === folder.id && "nb-folder--active",
          isOver && "nb-folder--droptarget",
        )}
        style={{ paddingLeft: 10 + depth * 14 }}
        onClick={() => onSelect(folder.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        {children.length > 0 ? <ChevronRight size={12} /> : <Folder size={13} />}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {folder.name}
        </span>
        <span className="nb-folder__count">{count > 0 ? count : ""}</span>
      </button>
      {children.map((f) => (
        <FolderNode
          key={f.id}
          board={board}
          folder={f}
          depth={depth + 1}
          activeFolderId={activeFolderId}
          onSelect={onSelect}
          onNewSubfolder={onNewSubfolder}
        />
      ))}
      {menu && (
        <Menu position={menu} onClose={() => setMenu(null)}>
          <MenuItem icon={<Pencil size={14} />} onSelect={() => setRenaming(true)}>
            Rename
          </MenuItem>
          <MenuItem icon={<FolderPlus size={14} />} onSelect={() => onNewSubfolder(folder.id)}>
            New subfolder
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash2 size={14} />} danger onSelect={() => setDeleting(true)}>
            Move to Trash
          </MenuItem>
        </Menu>
      )}
      {renaming && (
        <RenameModal
          item={null}
          initialValue={folder.name}
          onSubmit={(name) => notesBoard.renameFolder(board.id, folder.id, name)}
          onClose={() => setRenaming(false)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Move folder to Trash?"
          message={`"${folder.name}" and the notes inside it will move to this project's Trash.`}
          confirmLabel="Move to Trash"
          destructive
          onConfirm={() => {
            notesBoard.deleteFolder(board.id, folder.id);
            setDeleting(false);
          }}
          onCancel={() => setDeleting(false)}
        />
      )}
    </>
  );
}

/* ── Note list ── */

function NoteListPane({
  board,
  activeFolderId,
  filter,
  setFilter,
}: {
  board: NotesBoard;
  activeFolderId: string | null;
  filter: string;
  setFilter: (v: string) => void;
}) {
  const notes = useNotes((s) => s.notes);
  const [sortMenu, setSortMenu] = useState<MenuPosition | null>(null);

  const folderName =
    activeFolderId === null
      ? "All notes"
      : board.folders.find((f) => f.id === activeFolderId)?.name ?? "";

  const refs = useMemo(() => {
    let list =
      activeFolderId === null
        ? [...board.noteRefs]
        : board.noteRefs.filter((r) => r.folderId === activeFolderId);
    if (filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter((r) => {
        const n = notes[r.noteId];
        return n && (n.title.toLowerCase().includes(q) || extractPreview(n.doc).toLowerCase().includes(q));
      });
    }
    const dir = board.sort.dir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const na = notes[a.noteId];
      const nb = notes[b.noteId];
      if (!na || !nb) return 0;
      switch (board.sort.by) {
        case "manual":
          return (a.order - b.order) * dir;
        case "title":
          return na.title.localeCompare(nb.title) * dir;
        case "createdAt":
          return na.createdAt.localeCompare(nb.createdAt) * dir;
        case "modifiedAt":
          return na.modifiedAt.localeCompare(nb.modifiedAt) * dir;
      }
    });
    return list;
  }, [board.noteRefs, board.sort, activeFolderId, filter, notes]);

  const sortLabel = {
    manual: "Manual",
    title: "Title",
    createdAt: "Created",
    modifiedAt: "Modified",
  }[board.sort.by];

  return (
    <section className="nb__list">
      <div className="nb__listhead">
        <div className="nb__listtitle">{folderName}</div>
        <TextInput
          className="nb__filter"
          placeholder="Filter notes…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <Button variant="ghost" onClick={(e) => setSortMenu({ x: e.clientX, y: e.clientY })}>
          {board.sort.dir === "asc" ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />}
          {sortLabel}
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            const { noteId } = notesBoard.createNote(board.id, activeFolderId);
            useNoteModal.getState().open(noteId, "edit");
          }}
        >
          <Plus size={14} /> New note
        </Button>
      </div>

      {refs.length === 0 ? (
        <EmptyState
          icon={<FilePlus2 size={24} strokeWidth={1.5} />}
          title={filter ? "No matching notes" : "No notes here yet"}
          message={filter ? "Try a different filter." : "Create a note to start filling this folder."}
          action={
            !filter && (
              <Button
                variant="primary"
                onClick={() => {
                  const { noteId } = notesBoard.createNote(board.id, activeFolderId);
                  useNoteModal.getState().open(noteId, "edit");
                }}
              >
                <Plus size={14} /> New note
              </Button>
            )
          }
        />
      ) : (
        refs.map((r) => <NoteRow key={r.id} board={board} noteRef={r} />)
      )}

      {sortMenu && (
        <Menu position={sortMenu} onClose={() => setSortMenu(null)}>
          {(
            [
              ["manual", "Manual"],
              ["title", "Title"],
              ["createdAt", "Date created"],
              ["modifiedAt", "Date modified"],
            ] as const
          ).map(([by, label]) => (
            <MenuItem
              key={by}
              onSelect={() =>
                notesBoard.setSort(
                  board.id,
                  by,
                  board.sort.by === by && board.sort.dir === "asc" ? "desc" : "asc",
                )
              }
            >
              {label}
              {board.sort.by === by ? (board.sort.dir === "asc" ? " ↑" : " ↓") : ""}
            </MenuItem>
          ))}
        </Menu>
      )}
    </section>
  );
}

/* ── Note row ── */

function NoteRow({ board, noteRef }: { board: NotesBoard; noteRef: NoteRef }) {
  const note = useNotes((s) => s.notes[noteRef.noteId]);
  const boards = useProject((s) => s.boards);
  const categories = useProject((s) => s.meta?.categories ?? []);
  const [menu, setMenu] = useState<MenuPosition | null>(null);
  const [confirmIndependent, setConfirmIndependent] = useState(false);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `ref-${noteRef.id}`,
    data: { refId: noteRef.id },
  });

  if (!note) return null;

  const refcount = refcountOf(note.id, boards);
  const cats = note.categoryIds
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const preview = extractPreview(note.doc);

  const openNote = (mode: "read" | "edit") =>
    useNoteModal.getState().open(note.id, mode, { boardId: board.id, refId: noteRef.id });

  // Delay single-click open so a double-click can win and go straight to edit
  // (otherwise the popup from click 1 swallows click 2).
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRowClick = () => {
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => openNote("read"), 220);
  };
  const onRowDoubleClick = () => {
    if (clickTimer.current) clearTimeout(clickTimer.current);
    openNote("edit");
  };

  return (
    <>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={clsx(
          "noterow",
          isDragging && "noterow--dragging",
          note.color && "noterow--tinted",
        )}
        style={note.color ? ({ "--row-tint": note.color } as React.CSSProperties) : undefined}
        onClick={onRowClick}
        onDoubleClick={onRowDoubleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
        role="button"
        tabIndex={0}
      >
        <div className="noterow__main">
          <div className="noterow__title">
            {noteRef.pinned && <Pin size={13} className="noterow__pin" />}
            <span className="t">{note.title || "Untitled note"}</span>
            {refcount > 1 && <Link2 size={13} color="var(--text-muted)" />}
            {cats.map((c) => (
              <CategoryDot key={c.id} color={c.color} title={c.name} />
            ))}
          </div>
          {preview && <div className="noterow__preview">{preview}</div>}
        </div>
        <div className="noterow__side">
          <span className="noterow__date">
            {new Date(note.modifiedAt).toLocaleDateString()}
          </span>
          <IconButton
            label="Note options"
            onClick={(e) => {
              e.stopPropagation();
              setMenu({ x: e.clientX, y: e.clientY });
            }}
          >
            <MoreHorizontal size={15} />
          </IconButton>
        </div>
      </div>

      {menu && (
        <Menu position={menu} onClose={() => setMenu(null)}>
          <MenuItem onSelect={() => openNote("read")}>Open</MenuItem>
          <MenuItem icon={<Pencil size={14} />} onSelect={() => openNote("edit")}>
            Edit
          </MenuItem>
          <MenuItem
            icon={noteRef.pinned ? <PinOff size={14} /> : <Pin size={14} />}
            onSelect={() => notesBoard.togglePin(board.id, noteRef.id)}
          >
            {noteRef.pinned ? "Unpin" : "Pin"}
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            icon={<Copy size={14} />}
            onSelect={() => notesBoard.addRef(board.id, noteRef.folderId, note.id)}
          >
            Duplicate (linked)
          </MenuItem>
          {refcount > 1 && (
            <MenuItem icon={<Scissors size={14} />} onSelect={() => setConfirmIndependent(true)}>
              Make Independent
            </MenuItem>
          )}
          <MenuSeparator />
          <MenuItem icon={<Trash2 size={14} />} danger onSelect={() => setConfirmTrash(true)}>
            Move to Trash
          </MenuItem>
        </Menu>
      )}

      {confirmTrash && (
        <ConfirmDialog
          title="Move note to Trash?"
          message={`"${note.title || "Untitled note"}" will move to this project's Trash. You can restore it later.`}
          confirmLabel="Move to Trash"
          destructive
          onConfirm={() => {
            notesBoard.deleteRef(board.id, noteRef.id);
            setConfirmTrash(false);
          }}
          onCancel={() => setConfirmTrash(false)}
        />
      )}

      {confirmIndependent && (
        <ConfirmDialog
          title="Make this copy independent?"
          message="This creates a separate copy. Future edits will no longer appear in the other linked instances."
          confirmLabel="Make Independent"
          onConfirm={() => {
            notesBoard.makeIndependent(board.id, noteRef.id);
            setConfirmIndependent(false);
          }}
          onCancel={() => setConfirmIndependent(false)}
        />
      )}
    </>
  );
}

function DragPreview({ board, refId }: { board: NotesBoard; refId: string }) {
  const notes = useNotes((s) => s.notes);
  const ref = board.noteRefs.find((r) => r.id === refId);
  const note = ref ? notes[ref.noteId] : null;
  if (!note) return null;
  return (
    <div className="noterow" style={{ width: 280, boxShadow: "var(--shadow-soft)" }}>
      <div className="noterow__main">
        <div className="noterow__title">
          <span className="t">{note.title || "Untitled note"}</span>
        </div>
      </div>
    </div>
  );
}
