import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import clsx from "clsx";
import {
  ArrowUpRight,
  ChevronRight,
  ChevronsUpDown,
  Folder,
  FolderPlus,
  House,
  LogOut,
  Pencil,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  SquarePlus,
  Trash2,
} from "lucide-react";
import { useNav, type Screen } from "../../app/navStore";
import { useProject } from "../../stores/projectStore";
import { useSettings } from "../../stores/settingsStore";
import { saveQueue } from "../../lib/saveQueue";
import type { TreeItem } from "../../lib/schema";
import { useSearch } from "../../features/search/searchStore";
import { boardTypeInfo } from "../../features/dashboard/boardTypes";
import { RenameModal } from "../../features/dashboard/RenameModal";
import { CreateBoardModal } from "../../features/dashboard/CreateBoardModal";
import { Menu, MenuItem, MenuSeparator, type MenuPosition } from "../ui/Menu";
import { ConfirmDialog } from "../ui/Modal";
import { IconButton, Kbd } from "../ui/Button";
import { ProjectCover } from "./ProjectCover";
import { useSidebar } from "./sidebarStore";
import "./shell.css";

const ICON = { size: 16, strokeWidth: 1.75 };

export function Sidebar() {
  const screen = useNav((s) => s.screen);
  const navigate = useNav((s) => s.navigate);
  const trashCount = useProject((s) => s.trash.entries.length);
  const pathOf = useProject((s) => s.pathOf);
  const treeItems = useProject((s) => s.treeItems);
  const expand = useSidebar((s) => s.expand);
  const [addMenu, setAddMenu] = useState<MenuPosition | null>(null);
  const [newBoard, setNewBoard] = useState<string | null | undefined>(undefined);
  const [newFolder, setNewFolder] = useState<string | null | undefined>(undefined);
  const createFolder = useProject((s) => s.createFolder);

  // Keep the current board or folder visible in the tree.
  const currentId = screen.name === "board" ? screen.boardId : screen.name === "folder" ? screen.folderId : null;
  useEffect(() => {
    if (!currentId) return;
    const folders = pathOf(currentId)
      .filter((p) => p.kind === "folder")
      .map((p) => p.id);
    expand(screen.name === "board" ? folders.filter((id) => id !== currentId) : folders);
  }, [currentId, screen.name, pathOf, expand, treeItems]);

  return (
    <nav className="sidebar" aria-label="Project">
      <div className="sidebar__top">
        <ProjectSwitcher />
        <button className="sb-search" onClick={() => useSearch.getState().setOverlayOpen(true)}>
          <Search size={14} strokeWidth={2} />
          <span className="sb-search__text">Search</span>
          <span className="sb-search__keys">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>

      <div className="sidebar__scroll">
        <NavRow
          icon={<House {...ICON} />}
          label="Home"
          active={screen.name === "dashboard"}
          onClick={() => navigate({ name: "dashboard" })}
        />

        <div className="sb-section">
          <div className="sb-section__head">
            <span>Boards</span>
            <IconButton
              label="Add a board or folder"
              className="sb-section__add"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setAddMenu({ x: r.left, y: r.bottom + 4 });
              }}
            >
              <Plus size={15} strokeWidth={2} />
            </IconButton>
          </div>
          <BoardTree onNewBoard={setNewBoard} onNewFolder={setNewFolder} />
        </div>
      </div>

      <div className="sidebar__foot">
        <NavRow
          icon={<Trash2 {...ICON} />}
          label="Trash"
          count={trashCount || undefined}
          active={screen.name === "trash"}
          onClick={() => navigate({ name: "trash" })}
        />
        <NavRow
          icon={<Settings {...ICON} />}
          label="Project settings"
          active={screen.name === "projectSettings"}
          onClick={() => navigate({ name: "projectSettings" })}
        />
      </div>

      {addMenu && (
        <Menu position={addMenu} onClose={() => setAddMenu(null)}>
          <MenuItem icon={<SquarePlus size={15} />} onSelect={() => setNewBoard(null)}>
            New board
          </MenuItem>
          <MenuItem icon={<FolderPlus size={15} />} onSelect={() => setNewFolder(null)}>
            New folder
          </MenuItem>
        </Menu>
      )}
      {newBoard !== undefined && (
        <CreateBoardModal parentId={newBoard} onClose={() => setNewBoard(undefined)} />
      )}
      {newFolder !== undefined && (
        <RenameModal
          item={null}
          title="New folder"
          confirmLabel="Create"
          initialValue=""
          placeholder="Worldbuilding"
          onSubmit={(name) => {
            const id = createFolder(newFolder, name);
            if (newFolder) expand([newFolder]);
            navigate({ name: "folder", folderId: id });
          }}
          onClose={() => setNewFolder(undefined)}
        />
      )}
    </nav>
  );
}

function NavRow({
  icon,
  label,
  active,
  count,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      className={clsx("sb-row", active && "sb-row--active")}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      <span className="sb-row__icon">{icon}</span>
      <span className="sb-row__label">{label}</span>
      {count !== undefined && <span className="sb-row__count">{count}</span>}
    </button>
  );
}

/* ── Project switcher ── */

function ProjectSwitcher() {
  const meta = useProject((s) => s.meta);
  const projectPath = useProject((s) => s.projectPath);
  const openProject = useProject((s) => s.open);
  const close = useProject((s) => s.close);
  const recents = useSettings((s) => s.recents);
  const navigate = useNav((s) => s.navigate);
  const [menu, setMenu] = useState<MenuPosition | null>(null);

  if (!meta || !projectPath) return null;
  const others = recents.filter((r) => r.path !== projectPath).slice(0, 5);

  const switchTo = async (path: string) => {
    await saveQueue.flush();
    try {
      await openProject(path);
    } catch {
      await close();
    }
  };

  return (
    <>
      <button
        className="sb-project"
        aria-haspopup="menu"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setMenu({ x: r.left, y: r.bottom + 4 });
        }}
      >
        <ProjectCover path={projectPath} name={meta.name} coverImage={meta.coverImage} color={meta.color} size={26} />
        <span className="sb-project__name">{meta.name}</span>
        <ChevronsUpDown size={14} strokeWidth={2} className="sb-project__chev" />
      </button>
      {menu && (
        <Menu position={menu} onClose={() => setMenu(null)}>
          {others.map((r) => (
            <MenuItem
              key={r.path}
              icon={<ProjectCover path={r.path} name={r.name} coverImage={r.coverImage} color={r.color} size={18} />}
              onSelect={() => void switchTo(r.path)}
            >
              {r.name}
            </MenuItem>
          ))}
          {others.length > 0 && <MenuSeparator />}
          <MenuItem icon={<Settings size={15} />} onSelect={() => navigate({ name: "projectSettings" })}>
            Project settings
          </MenuItem>
          <MenuItem icon={<SlidersHorizontal size={15} />} onSelect={() => navigate({ name: "appSettings" })}>
            App settings
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<LogOut size={15} />} onSelect={() => void close()}>
            Close project
          </MenuItem>
        </Menu>
      )}
    </>
  );
}

/* ── Board tree ── */

function BoardTree({
  onNewBoard,
  onNewFolder,
}: {
  onNewBoard: (parentId: string | null) => void;
  onNewFolder: (parentId: string | null) => void;
}) {
  const childrenOf = useProject((s) => s.childrenOf);
  useProject((s) => s.treeItems);
  const roots = childrenOf(null);

  if (roots.length === 0) {
    return (
      <button className="sb-empty" onClick={() => onNewBoard(null)}>
        <Plus size={14} strokeWidth={2} />
        Create your first board
      </button>
    );
  }

  return (
    <div role="tree" aria-label="Boards" className="sb-tree">
      {roots.map((item, i) => (
        <TreeNode
          key={item.id}
          item={item}
          depth={0}
          first={i === 0}
          onNewBoard={onNewBoard}
          onNewFolder={onNewFolder}
        />
      ))}
    </div>
  );
}

function isActive(screen: Screen, id: string) {
  return (
    (screen.name === "folder" && screen.folderId === id) || (screen.name === "board" && screen.boardId === id)
  );
}

function TreeNode({
  item,
  depth,
  first,
  onNewBoard,
  onNewFolder,
}: {
  item: TreeItem;
  depth: number;
  first?: boolean;
  onNewBoard: (parentId: string | null) => void;
  onNewFolder: (parentId: string | null) => void;
}) {
  const screen = useNav((s) => s.screen);
  const navigate = useNav((s) => s.navigate);
  const childrenOf = useProject((s) => s.childrenOf);
  const pathOf = useProject((s) => s.pathOf);
  const deleteTreeItem = useProject((s) => s.deleteTreeItem);
  const expanded = useSidebar((s) => s.expanded.has(item.id));
  const toggleFolder = useSidebar((s) => s.toggleFolder);
  const [menu, setMenu] = useState<MenuPosition | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const isFolder = item.kind === "folder";
  const active = isActive(screen, item.id);
  const anyActive = screen.name === "board" || screen.name === "folder";
  const kids = isFolder ? childrenOf(item.id) : [];

  const open = () =>
    navigate(isFolder ? { name: "folder", folderId: item.id } : { name: "board", boardId: item.id });

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tree = e.currentTarget.closest('[role="tree"]');
    const rows = [...(tree?.querySelectorAll<HTMLElement>('[role="treeitem"]') ?? [])];
    const i = rows.indexOf(e.currentTarget);
    const focus = (el: HTMLElement | undefined) => el?.focus();
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focus(rows[i + 1]);
        break;
      case "ArrowUp":
        e.preventDefault();
        focus(rows[i - 1]);
        break;
      case "Home":
        e.preventDefault();
        focus(rows[0]);
        break;
      case "End":
        e.preventDefault();
        focus(rows[rows.length - 1]);
        break;
      case "ArrowRight":
        e.preventDefault();
        if (isFolder && !expanded) toggleFolder(item.id);
        else if (isFolder && kids.length) focus(rows[i + 1]);
        break;
      case "ArrowLeft": {
        e.preventDefault();
        if (isFolder && expanded) {
          toggleFolder(item.id);
          break;
        }
        for (let j = i - 1; j >= 0; j--) {
          if (Number(rows[j].getAttribute("aria-level")) === depth) return focus(rows[j]);
        }
        break;
      }
      case "Enter":
      case " ":
        e.preventDefault();
        open();
        break;
      case "ContextMenu":
      case "F10":
        if (e.key === "F10" && !e.shiftKey) return;
        e.preventDefault();
        {
          const r = e.currentTarget.getBoundingClientRect();
          setMenu({ x: r.left + 24, y: r.bottom });
        }
        break;
    }
  };

  const remove = () => {
    const activeId = screen.name === "board" ? screen.boardId : screen.name === "folder" ? screen.folderId : null;
    const leavesView = activeId !== null && pathOf(activeId).some((p) => p.id === item.id);
    deleteTreeItem(item.id);
    setDeleting(false);
    if (leavesView) navigate({ name: "dashboard" });
  };

  return (
    <>
      <div
        ref={rowRef}
        role="treeitem"
        aria-level={depth + 1}
        aria-expanded={isFolder ? expanded : undefined}
        aria-selected={active}
        tabIndex={active || (!anyActive && first && depth === 0) ? 0 : -1}
        className={clsx("sb-row sb-node", active && "sb-row--active")}
        style={{ paddingLeft: 4 + depth * 14 }}
        title={item.name}
        onClick={open}
        onKeyDown={onKeyDown}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        <span
          className={clsx("sb-node__chev", isFolder && expanded && "sb-node__chev--open", !isFolder && "sb-node__chev--none")}
          onClick={(e) => {
            if (!isFolder) return;
            e.stopPropagation();
            toggleFolder(item.id);
          }}
          aria-hidden
        >
          {isFolder && <ChevronRight size={13} strokeWidth={2.25} />}
        </span>
        <span className="sb-row__icon">
          {isFolder ? <Folder {...ICON} /> : boardTypeInfo(item.boardType).icon(16)}
        </span>
        <span className="sb-row__label">{item.name}</span>
      </div>

      {isFolder && expanded && kids.length > 0 && (
        <div role="group" className="sb-group">
          {kids.map((k) => (
            <TreeNode key={k.id} item={k} depth={depth + 1} onNewBoard={onNewBoard} onNewFolder={onNewFolder} />
          ))}
        </div>
      )}

      {menu && (
        <Menu position={menu} onClose={() => setMenu(null)}>
          <MenuItem icon={<ArrowUpRight size={15} />} onSelect={open}>Open</MenuItem>
          {isFolder && (
            <>
              <MenuItem icon={<SquarePlus size={15} />} onSelect={() => onNewBoard(item.id)}>
                New board here
              </MenuItem>
              <MenuItem icon={<FolderPlus size={15} />} onSelect={() => onNewFolder(item.id)}>
                New subfolder
              </MenuItem>
            </>
          )}
          <MenuItem icon={<Pencil size={15} />} onSelect={() => setRenaming(true)}>
            Rename
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash2 size={15} />} danger onSelect={() => setDeleting(true)}>
            Move to Trash
          </MenuItem>
        </Menu>
      )}
      {renaming && <RenameModal item={item} onClose={() => setRenaming(false)} />}
      {deleting && (
        <ConfirmDialog
          title={isFolder ? "Move folder to Trash?" : "Move board to Trash?"}
          message={
            isFolder
              ? `"${item.name}" and everything inside it will move to this project's Trash. You can restore it later.`
              : `"${item.name}" will move to this project's Trash. You can restore it later.`
          }
          confirmLabel="Move to Trash"
          destructive
          onConfirm={remove}
          onCancel={() => setDeleting(false)}
        />
      )}
    </>
  );
}
