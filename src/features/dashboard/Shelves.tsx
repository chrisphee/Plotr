import { useState } from "react";
import {
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useNav } from "../../app/navStore";
import { useProject } from "../../stores/projectStore";
import type { TreeBoard, TreeFolder } from "../../lib/schema";
import { IconButton } from "../../components/ui/Button";
import { Menu, MenuItem, MenuSeparator, type MenuPosition } from "../../components/ui/Menu";
import { ConfirmDialog } from "../../components/ui/Modal";
import { RenameModal } from "./RenameModal";
import { CreateBoardModal } from "./CreateBoardModal";
import { boardItemCount, boardTypeInfo } from "./boardTypes";
import "./dashboard.css";

/* Renders the children of `parentId` as shelves: boards (and subfolders) of
   each child folder in a horizontal row, plus a shelf for loose boards. */

interface ShelvesProps {
  parentId: string | null;
}

export function Shelves({ parentId }: ShelvesProps) {
  const childrenOf = useProject((s) => s.childrenOf);
  const treeItems = useProject((s) => s.treeItems);
  void treeItems; // subscribe so shelves re-render on any tree change

  const children = childrenOf(parentId);
  const folders = children.filter((c): c is TreeFolder => c.kind === "folder");
  const looseBoards = children.filter((c): c is TreeBoard => c.kind === "board");

  const [newFolder, setNewFolder] = useState(false);
  const [newBoardIn, setNewBoardIn] = useState<{ parentId: string | null } | null>(null);

  return (
    <>
      {looseBoards.length > 0 && (
        <section className="shelf">
          <div className="shelf__head">
            <span className="shelf__title">Boards</span>
            <span className="shelf__count">{looseBoards.length}</span>
          </div>
          <div className="shelf__row">
            {looseBoards.map((b) => (
              <BoardTile key={b.id} board={b} />
            ))}
            <button className="tile tile--add" onClick={() => setNewBoardIn({ parentId })}>
              <Plus size={15} /> New board
            </button>
          </div>
        </section>
      )}

      {folders.map((f) => (
        <FolderShelf key={f.id} folder={f} onNewBoard={() => setNewBoardIn({ parentId: f.id })} />
      ))}

      <section className="shelf">
        <div className="shelf__row">
          {looseBoards.length === 0 && (
            <button className="tile tile--add" onClick={() => setNewBoardIn({ parentId })}>
              <Plus size={15} /> New board
            </button>
          )}
          <button className="tile tile--add" onClick={() => setNewFolder(true)}>
            <FolderPlus size={15} /> New folder
          </button>
        </div>
      </section>

      {newFolder && <NewFolderModal parentId={parentId} onClose={() => setNewFolder(false)} />}
      {newBoardIn && (
        <CreateBoardModal parentId={newBoardIn.parentId} onClose={() => setNewBoardIn(null)} />
      )}
    </>
  );
}

function FolderShelf({ folder, onNewBoard }: { folder: TreeFolder; onNewBoard: () => void }) {
  const childrenOf = useProject((s) => s.childrenOf);
  const navigate = useNav((s) => s.navigate);
  const children = childrenOf(folder.id);
  const [menu, setMenu] = useState<MenuPosition | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteTreeItem = useProject((s) => s.deleteTreeItem);
  const createFolder = useProject((s) => s.createFolder);

  return (
    <section className="shelf">
      <div className="shelf__head">
        <button
          className="shelf__title"
          onClick={() => navigate({ name: "folder", folderId: folder.id })}
        >
          {folder.name}
        </button>
        <span className="shelf__count">{children.length}</span>
        <div className="shelf__spacer" />
        <IconButton label="Folder options" onClick={(e) => setMenu({ x: e.clientX, y: e.clientY })}>
          <MoreHorizontal size={15} />
        </IconButton>
      </div>
      <div className="shelf__row">
        {children.map((item) =>
          item.kind === "board" ? (
            <BoardTile key={item.id} board={item} />
          ) : (
            <FolderTile key={item.id} folder={item} />
          ),
        )}
        <button className="tile tile--add" onClick={onNewBoard}>
          <Plus size={15} /> New board
        </button>
      </div>

      {menu && (
        <Menu position={menu} onClose={() => setMenu(null)}>
          <MenuItem icon={<Pencil size={14} />} onSelect={() => setRenaming(true)}>
            Rename
          </MenuItem>
          <MenuItem
            icon={<FolderPlus size={14} />}
            onSelect={() => createFolder(folder.id, "New Folder")}
          >
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

export function BoardTile({ board }: { board: TreeBoard }) {
  const navigate = useNav((s) => s.navigate);
  const boards = useProject((s) => s.boards);
  const deleteTreeItem = useProject((s) => s.deleteTreeItem);
  const [menu, setMenu] = useState<MenuPosition | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const info = boardTypeInfo(board.boardType);
  const count = boardItemCount(boards[board.id]);

  return (
    <>
      <div
        className="tile"
        role="button"
        tabIndex={0}
        onClick={() => navigate({ name: "board", boardId: board.id })}
        onKeyDown={(e) => e.key === "Enter" && navigate({ name: "board", boardId: board.id })}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        <span className="tile__icon">{info.icon()}</span>
        <span>
          <span className="tile__name">{board.name}</span>
          <span className="tile__meta">
            {info.name} · {count} {count === 1 ? "item" : "items"}
          </span>
        </span>
        <span
          className="tile__menu"
          onClick={(e) => {
            e.stopPropagation();
            setMenu({ x: e.clientX, y: e.clientY });
          }}
        >
          <IconButton label="Board options" onClick={() => {}}>
            <MoreHorizontal size={15} />
          </IconButton>
        </span>
      </div>

      {menu && (
        <Menu position={menu} onClose={() => setMenu(null)}>
          <MenuItem onSelect={() => navigate({ name: "board", boardId: board.id })}>
            Open
          </MenuItem>
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

function FolderTile({ folder }: { folder: TreeFolder }) {
  const navigate = useNav((s) => s.navigate);
  const childrenOf = useProject((s) => s.childrenOf);
  const count = childrenOf(folder.id).length;
  return (
    <button
      className="tile tile--folder"
      onClick={() => navigate({ name: "folder", folderId: folder.id })}
    >
      <span className="tile__icon">
        <Folder size={18} strokeWidth={1.75} />
      </span>
      <span>
        <span className="tile__name">{folder.name}</span>
        <span className="tile__meta">
          Folder · {count} {count === 1 ? "item" : "items"}
        </span>
      </span>
    </button>
  );
}

function NewFolderModal({ parentId, onClose }: { parentId: string | null; onClose: () => void }) {
  const createFolder = useProject((s) => s.createFolder);
  return (
    <RenameModal
      item={null}
      title="New Folder"
      confirmLabel="Create"
      initialValue=""
      placeholder="Worldbuilding"
      onSubmit={(name) => createFolder(parentId, name)}
      onClose={onClose}
    />
  );
}
