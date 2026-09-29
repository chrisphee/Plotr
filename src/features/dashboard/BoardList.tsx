import { useState } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Folder,
  FolderPlus,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useNav } from "../../app/navStore";
import { useProject } from "../../stores/projectStore";
import { useNotes } from "../../stores/notesStore";
import type { BoardType, TreeBoard, TreeFolder, TreeItem } from "../../lib/schema";
import { shortDate } from "../../lib/time";
import { IconButton } from "../../components/ui/Button";
import { Menu, MenuItem, MenuSeparator, type MenuPosition } from "../../components/ui/Menu";
import { ConfirmDialog } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { RenameModal } from "./RenameModal";
import { CreateBoardModal } from "./CreateBoardModal";
import { BoardPreview, FolderPreview } from "./BoardPreview";
import { BOARD_TYPES, boardEditedAt, boardItemCount, boardTypeInfo, countLabel } from "./boardTypes";
import "./dashboard.css";

export type TypeFilter = "all" | BoardType;

type NewBoardTarget = { parentId: string | null; type?: BoardType };

/* The children of `parentId` as card grids: loose boards first, then one
   section per child folder. */

export function BoardList({ parentId, filter }: { parentId: string | null; filter: TypeFilter }) {
  const childrenOf = useProject((s) => s.childrenOf);
  useProject((s) => s.treeItems);
  const [newBoard, setNewBoard] = useState<NewBoardTarget | null>(null);
  const [newFolderIn, setNewFolderIn] = useState<string | null | undefined>(undefined);

  const children = childrenOf(parentId);
  const folders = children.filter((c): c is TreeFolder => c.kind === "folder");
  const looseBoards = children.filter((c): c is TreeBoard => c.kind === "board" && matches(c, filter));
  const visibleFolders = folders.filter((f) => filter === "all" || hasMatch(f.id, filter, childrenOf));

  const modals = (
    <>
      {newBoard && (
        <CreateBoardModal
          parentId={newBoard.parentId}
          initialType={newBoard.type}
          onClose={() => setNewBoard(null)}
        />
      )}
      {newFolderIn !== undefined && <NewFolderModal parentId={newFolderIn} onClose={() => setNewFolderIn(undefined)} />}
    </>
  );

  if (children.length === 0) {
    return (
      <div className="starter">
        <div className="starter__types">
          {BOARD_TYPES.map((t) => (
            <button key={t.type} className="typecard" onClick={() => setNewBoard({ parentId, type: t.type })}>
              <span className="typecard__icon">{t.icon(20)}</span>
              <span className="typecard__name">{t.name}</span>
              <span className="typecard__desc">{t.description}</span>
            </button>
          ))}
        </div>
        <button className="textbtn" onClick={() => setNewFolderIn(parentId)}>
          <FolderPlus size={15} strokeWidth={1.75} />
          Or start with a folder
        </button>
        {modals}
      </div>
    );
  }

  return (
    <div className="boardlist">
      {(looseBoards.length > 0 || (filter === "all" && folders.length === 0)) && (
        <section className="bgroup">
          {parentId === null && visibleFolders.length > 0 && (
            <div className="bgroup__head">
              <span className="bgroup__title bgroup__title--static">
                <LayoutGrid size={16} strokeWidth={1.75} />
                <span className="bgroup__name">Not in a folder</span>
              </span>
              <span className="bgroup__count">
                {looseBoards.length} {looseBoards.length === 1 ? "board" : "boards"}
              </span>
            </div>
          )}
          <div className="bgrid">
            {looseBoards.map((b) => (
              <BoardCard key={b.id} board={b} />
            ))}
            {filter === "all" && <NewCard onClick={() => setNewBoard({ parentId })} />}
          </div>
        </section>
      )}

      {visibleFolders.map((f) => (
        <FolderSection
          key={f.id}
          folder={f}
          filter={filter}
          onNewBoard={() => setNewBoard({ parentId: f.id })}
          onNewFolder={() => setNewFolderIn(f.id)}
        />
      ))}

      {looseBoards.length === 0 && visibleFolders.length === 0 && (
        <EmptyState title="No boards of this type" message="Choose another filter, or create a board of this type." />
      )}

      {modals}
    </div>
  );
}

function matches(board: TreeBoard, filter: TypeFilter) {
  return filter === "all" || board.boardType === filter;
}

function hasMatch(folderId: string, filter: TypeFilter, childrenOf: (id: string | null) => TreeItem[]): boolean {
  return childrenOf(folderId).some((c) =>
    c.kind === "board" ? matches(c, filter) : hasMatch(c.id, filter, childrenOf),
  );
}

function FolderSection({
  folder,
  filter,
  onNewBoard,
  onNewFolder,
}: {
  folder: TreeFolder;
  filter: TypeFilter;
  onNewBoard: () => void;
  onNewFolder: () => void;
}) {
  const childrenOf = useProject((s) => s.childrenOf);
  const navigate = useNav((s) => s.navigate);
  const [menu, setMenu] = useState<MenuPosition | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteTreeItem = useProject((s) => s.deleteTreeItem);

  const all = childrenOf(folder.id);
  const shown = all.filter((c) =>
    c.kind === "board" ? matches(c, filter) : filter === "all" || hasMatch(c.id, filter, childrenOf),
  );
  const open = () => navigate({ name: "folder", folderId: folder.id });

  return (
    <section className="bgroup">
      <div
        className="bgroup__head"
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        <button className="bgroup__title" onClick={open}>
          <Folder size={16} strokeWidth={1.75} />
          <span className="bgroup__name">{folder.name}</span>
          <ChevronRight size={15} strokeWidth={2} className="bgroup__chev" />
        </button>
        <span className="bgroup__count">
          {all.length} {all.length === 1 ? "item" : "items"}
        </span>
        <span className="bgroup__tools">
          <IconButton
            label={`${folder.name} options`}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setMenu({ x: r.left, y: r.bottom + 4 });
            }}
          >
            <MoreHorizontal size={16} strokeWidth={1.75} />
          </IconButton>
          <IconButton label={`New board in ${folder.name}`} onClick={onNewBoard}>
            <Plus size={16} strokeWidth={2} />
          </IconButton>
        </span>
      </div>

      <div className="bgrid">
        {shown.map((item) =>
          item.kind === "board" ? <BoardCard key={item.id} board={item} /> : <FolderCard key={item.id} folder={item} />,
        )}
        {filter === "all" && shown.length === 0 && <NewCard onClick={onNewBoard} />}
      </div>

      {menu && (
        <Menu position={menu} onClose={() => setMenu(null)}>
          <MenuItem icon={<ArrowUpRight size={15} />} onSelect={open}>Open</MenuItem>
          <MenuItem icon={<Plus size={15} />} onSelect={onNewBoard}>
            New board here
          </MenuItem>
          <MenuItem icon={<FolderPlus size={15} />} onSelect={onNewFolder}>
            New subfolder
          </MenuItem>
          <MenuItem icon={<Pencil size={15} />} onSelect={() => setRenaming(true)}>
            Rename
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash2 size={15} />} danger onSelect={() => setDeleting(true)}>
            Move to Trash
          </MenuItem>
        </Menu>
      )}
      {renaming && <RenameModal item={folder} onClose={() => setRenaming(false)} />}
      {deleting && (
        <ConfirmDialog
          title="Move folder to Trash?"
          message={`"${folder.name}" and everything inside it will move to this project's Trash. You can restore it later.`}
          confirmLabel="Move to Trash"
          destructive
          onConfirm={() => {
            deleteTreeItem(folder.id);
            setDeleting(false);
          }}
          onCancel={() => setDeleting(false)}
        />
      )}
    </section>
  );
}

export function BoardCard({ board }: { board: TreeBoard }) {
  const navigate = useNav((s) => s.navigate);
  const data = useProject((s) => s.boards[board.id]);
  const notes = useNotes((s) => s.notes);
  const deleteTreeItem = useProject((s) => s.deleteTreeItem);
  const [menu, setMenu] = useState<MenuPosition | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const open = () => navigate({ name: "board", boardId: board.id });
  const edited = shortDate(boardEditedAt(data, notes));

  return (
    <div
      className="bcard"
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <button className="bcard__hit" onClick={open} aria-label={`Open ${board.name}`} />
      <BoardPreview board={data} />
      <div className="bcard__body">
        <span className="bcard__icon">{boardTypeInfo(board.boardType).icon(16)}</span>
        <span className="bcard__text">
          <span className="bcard__name">{board.name}</span>
          <span className="bcard__meta">
            {countLabel(board.boardType, boardItemCount(data))}
            {edited && ` · ${edited}`}
          </span>
        </span>
        <IconButton
          label={`${board.name} options`}
          className="bcard__more"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setMenu({ x: r.left, y: r.bottom + 4 });
          }}
        >
          <MoreHorizontal size={16} strokeWidth={1.75} />
        </IconButton>
      </div>

      {menu && (
        <Menu position={menu} onClose={() => setMenu(null)}>
          <MenuItem icon={<ArrowUpRight size={15} />} onSelect={open}>Open</MenuItem>
          <MenuItem icon={<Pencil size={15} />} onSelect={() => setRenaming(true)}>
            Rename
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash2 size={15} />} danger onSelect={() => setDeleting(true)}>
            Move to Trash
          </MenuItem>
        </Menu>
      )}
      {renaming && <RenameModal item={board} onClose={() => setRenaming(false)} />}
      {deleting && (
        <ConfirmDialog
          title="Move board to Trash?"
          message={`"${board.name}" will move to this project's Trash. You can restore it later.`}
          confirmLabel="Move to Trash"
          destructive
          onConfirm={() => {
            deleteTreeItem(board.id);
            setDeleting(false);
          }}
          onCancel={() => setDeleting(false)}
        />
      )}
    </div>
  );
}

function FolderCard({ folder }: { folder: TreeFolder }) {
  const navigate = useNav((s) => s.navigate);
  const childrenOf = useProject((s) => s.childrenOf);
  const items = childrenOf(folder.id);
  return (
    <div className="bcard">
      <button
        className="bcard__hit"
        onClick={() => navigate({ name: "folder", folderId: folder.id })}
        aria-label={`Open folder ${folder.name}`}
      />
      <FolderPreview items={items} />
      <div className="bcard__body">
        <span className="bcard__icon">
          <Folder size={16} strokeWidth={1.75} />
        </span>
        <span className="bcard__text">
          <span className="bcard__name">{folder.name}</span>
          <span className="bcard__meta">
            Folder · {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </span>
      </div>
    </div>
  );
}

function NewCard({ onClick }: { onClick: () => void }) {
  return (
    <button className="bcard bcard--new" onClick={onClick}>
      <span className="bcard__plus">
        <Plus size={18} strokeWidth={2} />
      </span>
      New board
    </button>
  );
}

function NewFolderModal({ parentId, onClose }: { parentId: string | null; onClose: () => void }) {
  const createFolder = useProject((s) => s.createFolder);
  return (
    <RenameModal
      item={null}
      title="New folder"
      confirmLabel="Create"
      initialValue=""
      placeholder="Worldbuilding"
      onSubmit={(name) => createFolder(parentId, name)}
      onClose={onClose}
    />
  );
}
