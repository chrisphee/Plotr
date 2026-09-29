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
  ArrowUpDown,
  ArrowUpRight,
  Copy,
  Folder,
  FolderPlus,
  Inbox,
  LayoutGrid,
  Link2,
  List,
  Pencil,
  Pin,
  PinOff,
  Scissors,
  Search,
  StickyNote,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import { useProject } from "../../stores/projectStore";
import { useNotes, refcountOf } from "../../stores/notesStore";
import { useNoteModal } from "../note-editor/noteModalStore";
import { notesBoard } from "./notesBoardActions";
import type { NoteRef, NotesBoard, NotesBoardFolder, TreeBoard } from "../../lib/schema";
import { AppShell, PrimaryAction } from "../../components/shell/TopBar";
import { Button, IconButton } from "../../components/ui/Button";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { TextInput } from "../../components/ui/Field";
import { Menu, MenuItem, MenuSeparator, type MenuPosition } from "../../components/ui/Menu";
import { ConfirmDialog } from "../../components/ui/Modal";
import { RenameModal } from "../dashboard/RenameModal";
import { CategoryChip } from "../../components/ui/CategoryChip";
import { shortDate } from "../../lib/time";
import { EmptyState } from "../../components/ui/EmptyState";
import { extractPreview } from "./preview";
import "./notesBoard.css";

/** Tree selection that lists pinned notes from every folder. */
const PINNED = "__pinned__";

type View = "list" | "gallery";
const VIEW_KEY = "plotr.notesView";

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "gallery" ? "gallery" : "list";
  } catch {
    return "list";
  }
}

export function NotesBoardScreen({ treeItem }: { treeItem: TreeBoard }) {
  const board = useProject((s) => s.boards[treeItem.id]) as NotesBoard | undefined;
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [dragRefId, setDragRefId] = useState<string | null>(null);
  const [view, setViewState] = useState<View>(readView);
  const setView = (v: View) => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* per-viewer convenience only */
    }
  };
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

  const newNote = () => {
    const folderId = activeFolderId === PINNED ? null : activeFolderId;
    const { noteId } = notesBoard.createNote(board.id, folderId);
    useNoteModal.getState().open(noteId, "edit");
  };

  return (
    <AppShell canvas actions={<PrimaryAction label="New note" onClick={newNote} />}>
      <DndContext
        sensors={sensors}
        onDragStart={(e) => setDragRefId(e.active.data.current?.refId ?? null)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragRefId(null)}
      >
        <div className="nb">
          <FolderTreePane board={board} activeFolderId={activeFolderId} onSelect={setActiveFolderId} />
          <NoteListPane
            board={board}
            activeFolderId={activeFolderId}
            filter={filter}
            setFilter={setFilter}
            view={view}
            setView={setView}
            onNewNote={newNote}
          />
        </div>
        <DragOverlay>
          {dragRefId && <DragPreview board={board} refId={dragRefId} />}
        </DragOverlay>
      </DndContext>
    </AppShell>
  );
}

/* ── Folder tree ── */

function FolderTreePane({
  board,
  activeFolderId,
  onSelect,
}: {
  board: NotesBoard;
  activeFolderId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [creating, setCreating] = useState<{ parentId: string | null } | null>(null);

  const roots = board.folders
    .filter((f) => f.parentId === null)
    .sort((a, b) => a.order - b.order);

  return (
    <aside className="nb__tree" aria-label="Note folders">
      <AllNotesRow board={board} active={activeFolderId === null} onSelect={() => onSelect(null)} />
      <button
        className={clsx("nb-folder", activeFolderId === PINNED && "nb-folder--active")}
        onClick={() => onSelect(PINNED)}
      >
        <Pin size={15} strokeWidth={1.75} className="nb-folder__icon" />
        <span className="nb-folder__name">Pinned</span>
        <span className="nb-folder__count">{board.noteRefs.filter((r) => r.pinned).length}</span>
      </button>
      <div className="nb__treehead">
        <span>Folders</span>
        <IconButton label="New folder" onClick={() => setCreating({ parentId: null })}>
          <FolderPlus size={15} strokeWidth={1.75} />
        </IconButton>
      </div>
      {roots.length === 0 && (
        <button className="nb__newfolder" onClick={() => setCreating({ parentId: null })}>
          Add a folder to sort notes
        </button>
      )}
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
      {creating && (
        <RenameModal
          item={null}
          title="New folder"
          confirmLabel="Create"
          placeholder="Main cast"
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
      <Inbox size={15} strokeWidth={1.75} className="nb-folder__icon" />
      <span className="nb-folder__name">All notes</span>
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
        <Folder size={15} strokeWidth={1.75} className="nb-folder__icon" />
        <span className="nb-folder__name">{folder.name}</span>
        <span className="nb-folder__count">{count}</span>
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
  view,
  setView,
  onNewNote,
}: {
  board: NotesBoard;
  activeFolderId: string | null;
  filter: string;
  setFilter: (v: string) => void;
  view: View;
  setView: (v: View) => void;
  onNewNote: () => void;
}) {
  const notes = useNotes((s) => s.notes);
  const [sortMenu, setSortMenu] = useState<MenuPosition | null>(null);

  const folderName =
    activeFolderId === null
      ? "All notes"
      : activeFolderId === PINNED
        ? "Pinned"
        : board.folders.find((f) => f.id === activeFolderId)?.name ?? "";

  const refs = useMemo(() => {
    let list =
      activeFolderId === null
        ? [...board.noteRefs]
        : activeFolderId === PINNED
          ? board.noteRefs.filter((r) => r.pinned)
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
        <div className="nb__heading">
          <h1 className="nb__listtitle">{folderName}</h1>
          <span className="nb__listcount">
            {refs.length} {refs.length === 1 ? "note" : "notes"}
          </span>
        </div>
        <div className="searchfield nb__filter">
          <Search size={14} strokeWidth={2} />
          <TextInput
            placeholder="Filter notes"
            aria-label="Filter notes"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setSortMenu({ x: r.left, y: r.bottom + 4 });
          }}
        >
          <ArrowUpDown size={14} strokeWidth={1.75} />
          {sortLabel}
        </Button>
        <SegmentedControl<View>
          label="Layout"
          value={view}
          onChange={setView}
          segments={[
            { value: "list", label: <List size={15} strokeWidth={1.75} />, title: "List" },
            { value: "gallery", label: <LayoutGrid size={15} strokeWidth={1.75} />, title: "Gallery" },
          ]}
        />
      </div>

      {refs.length === 0 ? (
        <EmptyState
          icon={
            activeFolderId === PINNED ? (
              <Pin size={22} strokeWidth={1.75} />
            ) : (
              <StickyNote size={22} strokeWidth={1.75} />
            )
          }
          title={filter ? "No matching notes" : activeFolderId === PINNED ? "No pinned notes" : "No notes here yet"}
          message={
            filter
              ? "Try a different filter."
              : activeFolderId === PINNED
                ? "Pin a note from its right-click menu to keep it here."
                : "Create a note to start filling this folder."
          }
          action={
            !filter && activeFolderId !== PINNED ? (
              <Button variant="secondary" onClick={onNewNote}>
                New note
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={view === "gallery" ? "nb__gallery" : "nb__rows"}>
          {refs.map((r) => (
            <NoteRow key={r.id} board={board} noteRef={r} view={view} />
          ))}
        </div>
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
                notesBoard.setSort(board.id, by, board.sort.by === by && board.sort.dir === "asc" ? "desc" : "asc")
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

/* ── Note row / card ── */

function NoteRow({ board, noteRef, view }: { board: NotesBoard; noteRef: NoteRef; view: View }) {
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

  // Delay single-click open so a double-click can win and go straight to edit
  // (otherwise the popup from click 1 swallows click 2).
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!note) return null;

  const refcount = refcountOf(note.id, boards);
  const cats = note.categoryIds
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const preview = extractPreview(note.doc);

  const openNote = (mode: "read" | "edit") =>
    useNoteModal.getState().open(note.id, mode, { boardId: board.id, refId: noteRef.id });

  const onRowClick = () => {
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => openNote("read"), 220);
  };
  const onRowDoubleClick = () => {
    if (clickTimer.current) clearTimeout(clickTimer.current);
    openNote("edit");
  };

  const title = (
    <span className="nrow__title">
      {noteRef.pinned && <Pin size={12} strokeWidth={2.25} className="nrow__pin" aria-label="Pinned" />}
      {note.color && <span className="nrow__color" style={{ background: note.color }} />}
      <span className="nrow__name">{note.title || "Untitled note"}</span>
      {refcount > 1 && (
        <Link2 size={13} strokeWidth={2} className="nrow__linked" aria-label={`Linked in ${refcount} places`} />
      )}
    </span>
  );

  const catList = cats.length > 0 && (
    <span className="nrow__cats">
      {cats.slice(0, view === "gallery" ? 3 : 2).map((c) => (
        <CategoryChip key={c.id} category={c} />
      ))}
      {cats.length > (view === "gallery" ? 3 : 2) && (
        <span className="nrow__more">+{cats.length - (view === "gallery" ? 3 : 2)}</span>
      )}
    </span>
  );

  return (
    <>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={clsx(view === "gallery" ? "ncard" : "nrow", isDragging && "nrow--dragging")}
        style={note.color ? ({ "--tint": note.color } as React.CSSProperties) : undefined}
        data-tinted={note.color ? "" : undefined}
        onClick={onRowClick}
        onDoubleClick={onRowDoubleClick}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openNote(e.shiftKey ? "edit" : "read");
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          const r = e.currentTarget.getBoundingClientRect();
          setMenu(e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : { x: r.left + 24, y: r.bottom });
        }}
        role="button"
        tabIndex={0}
      >
        {view === "gallery" ? (
          <>
            {title}
            <span className="ncard__preview">{preview || "No text yet"}</span>
            <span className="ncard__foot">
              {catList}
              <span className="nrow__date">{shortDate(note.modifiedAt)}</span>
            </span>
          </>
        ) : (
          <>
            <span className="nrow__main">
              {title}
              {preview && <span className="nrow__preview">{preview}</span>}
            </span>
            <span className="nrow__side">
              <span className="nrow__date">{shortDate(note.modifiedAt)}</span>
              {catList}
            </span>
          </>
        )}
      </div>

      {menu && (
        <Menu position={menu} onClose={() => setMenu(null)}>
          <MenuItem icon={<ArrowUpRight size={15} />} onSelect={() => openNote("read")}>
            Open
          </MenuItem>
          <MenuItem icon={<Pencil size={15} />} onSelect={() => openNote("edit")}>
            Edit
          </MenuItem>
          <MenuItem
            icon={noteRef.pinned ? <PinOff size={15} /> : <Pin size={15} />}
            onSelect={() => notesBoard.togglePin(board.id, noteRef.id)}
          >
            {noteRef.pinned ? "Unpin" : "Pin"}
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Copy size={15} />} onSelect={() => notesBoard.addRef(board.id, noteRef.folderId, note.id)}>
            Duplicate (linked)
          </MenuItem>
          {refcount > 1 && (
            <MenuItem icon={<Scissors size={15} />} onSelect={() => setConfirmIndependent(true)}>
              Make Independent
            </MenuItem>
          )}
          <MenuSeparator />
          <MenuItem icon={<Trash2 size={15} />} danger onSelect={() => setConfirmTrash(true)}>
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
    <div className="nrow nrow--ghost">
      <span className="nrow__title">
        <StickyNote size={14} strokeWidth={1.75} />
        <span className="nrow__name">{note.title || "Untitled note"}</span>
      </span>
    </div>
  );
}
