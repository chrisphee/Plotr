import { useState } from "react";
import { FolderPlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { BoardPreview } from "./BoardPreview";
import { boardEditedAt, boardItemCount, boardTypeInfo } from "./boardTypes";
import "./dashboard.css";

export type TypeFilter = "all" | BoardType;

/* The children of `parentId` as grouped list rows: one group per child
   folder, plus a "Boards" group for loose boards. */

export function BoardList({ parentId, filter }: { parentId: string | null; filter: TypeFilter }) {
  const childrenOf = useProject((s) => s.childrenOf);
  useProject((s) => s.treeItems);

  const children = childrenOf(parentId);
  const folders = children.filter((c): c is TreeFolder => c.kind === "folder");
  const looseBoards = children.filter(
    (c): c is TreeBoard => c.kind === "board" && matches(c, filter),
  );

  const [newFolder, setNewFolder] = useState(false);
  const [newBoardIn, setNewBoardIn] = useState<{ parentId: string | null } | null>(null);

  const visibleFolders = folders.filter((f) => filter === "all" || hasMatch(f.id, filter, childrenOf));
  const isEmpty = children.length === 0;

  return (
    <div className="boardlist">
      {isEmpty && (
        <EmptyState
          title={parentId ? "This folder is empty" : "No boards yet"}
          message="Create a board to start — a plot line, an info map, or a library of notes."
        />
      )}

      {looseBoards.length > 0 && (
        <section className="lgroup">
          <div className="lgroup__label">
            <span>Boards</span>
            <button onClick={() => setNewBoardIn({ parentId })}>+ Add</button>
          </div>
          {looseBoards.map((b) => (
            <BoardRow key={b.id} board={b} />
          ))}
        </section>
      )}

      {visibleFolders.map((f) => (
        <FolderGroup
          key={f.id}
          folder={f}
          filter={filter}
          onNewBoard={() => setNewBoardIn({ parentId: f.id })}
        />
      ))}

      {!isEmpty && looseBoards.length === 0 && visibleFolders.length === 0 && (
        <EmptyState title="No boards of this type" />
      )}

      <div className="boardlist__foot">
        {isEmpty && (
          <button className="textbtn" onClick={() => setNewBoardIn({ parentId })}>
            + New board
          </button>
        )}
        <button className="textbtn" onClick={() => setNewFolder(true)}>
          + New folder
        </button>
      </div>

      {newFolder && <NewFolderModal parentId={parentId} onClose={() => setNewFolder(false)} />}
      {newBoardIn && (
        <CreateBoardModal parentId={newBoardIn.parentId} onClose={() => setNewBoardIn(null)} />
      )}
    </div>
  );
}

function matches(board: TreeBoard, filter: TypeFilter) {
  return filter === "all" || board.boardType === filter;
}

function hasMatch(
  folderId: string,
  filter: TypeFilter,
  childrenOf: (id: string | null) => TreeItem[],
): boolean {
  return childrenOf(folderId).some((c) =>
    c.kind === "board" ? matches(c, filter) : hasMatch(c.id, filter, childrenOf),
  );
}

function FolderGroup({
  folder,
  filter,
  onNewBoard,
}: {
  folder: TreeFolder;
  filter: TypeFilter;
  onNewBoard: () => void;
}) {
  const childrenOf = useProject((s) => s.childrenOf);
  const navigate = useNav((s) => s.navigate);
  const deleteTreeItem = useProject((s) => s.deleteTreeItem);
  const createFolder = useProject((s) => s.createFolder);
  const [menu, setMenu] = useState<MenuPosition | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const children = childrenOf(folder.id).filter((c) =>
    c.kind === "board" ? matches(c, filter) : filter === "all" || hasMatch(c.id, filter, childrenOf),
  );

  return (
    <section className="lgroup">
      <div
        className="lgroup__label"
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        <button onClick={() => navigate({ name: "folder", folderId: folder.id })}>
          {folder.name}
        </button>
        <span className="lgroup__tools">
          <IconButton
            label="Folder options"
            className="lgroup__more"
            onClick={(e) => setMenu({ x: e.clientX, y: e.clientY })}
          >
            <MoreHorizontal size={15} strokeWidth={1.75} />
          </IconButton>
          <button onClick={onNewBoard}>+ Add</button>
        </span>
      </div>
      {children.length === 0 && <div className="boardlist__none">No boards yet</div>}
      {children.map((item) =>
        item.kind === "board" ? (
          <BoardRow key={item.id} board={item} />
        ) : (
          <SubfolderRow key={item.id} folder={item} />
        ),
      )}

      {menu && (
        <Menu position={menu} onClose={() => setMenu(null)}>
          <MenuItem icon={<Pencil size={14} />} onSelect={() => setRenaming(true)}>
            Rename
          </MenuItem>
          <MenuItem icon={<FolderPlus size={14} />} onSelect={() => createFolder(folder.id, "New folder")}>
            New subfolder
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash2 size={14} />} danger onSelect={() => setDeleting(true)}>
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

function BoardRow({ board }: { board: TreeBoard }) {
  const navigate = useNav((s) => s.navigate);
  const data = useProject((s) => s.boards[board.id]);
  const notes = useNotes((s) => s.notes);
  const deleteTreeItem = useProject((s) => s.deleteTreeItem);
  const [menu, setMenu] = useState<MenuPosition | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const open = () => navigate({ name: "board", boardId: board.id });

  return (
    <>
      <div
        className="lrow boardrow"
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => e.key === "Enter" && open()}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        <BoardPreview board={data} />
        <span className="lrow__name">{board.name}</span>
        <span className="tag">
          {boardTypeInfo(board.boardType).name} · {boardItemCount(data)}
        </span>
        <span className="lrow__mono boardrow__edited">{shortDate(boardEditedAt(data, notes))}</span>
      </div>

      {menu && (
        <Menu position={menu} onClose={() => setMenu(null)}>
          <MenuItem onSelect={open}>Open</MenuItem>
          <MenuItem icon={<Pencil size={14} />} onSelect={() => setRenaming(true)}>
            Rename
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash2 size={14} />} danger onSelect={() => setDeleting(true)}>
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
    </>
  );
}

function SubfolderRow({ folder }: { folder: TreeFolder }) {
  const navigate = useNav((s) => s.navigate);
  const childrenOf = useProject((s) => s.childrenOf);
  const count = childrenOf(folder.id).length;
  const open = () => navigate({ name: "folder", folderId: folder.id });
  return (
    <div
      className="lrow boardrow"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => e.key === "Enter" && open()}
    >
      <BoardPreview board="folder" />
      <span className="lrow__name">{folder.name}</span>
      <span className="tag">Folder · {count}</span>
      <span />
    </div>
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
