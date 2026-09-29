import { useState, type ReactNode } from "react";
import { Folder, FolderPlus } from "lucide-react";
import { useProject } from "../../stores/projectStore";
import { useNotes } from "../../stores/notesStore";
import { agoLong } from "../../lib/time";
import type { TreeBoard, TreeItem } from "../../lib/schema";
import { AppShell, PrimaryAction } from "../../components/shell/TopBar";
import { ProjectCover } from "../../components/shell/ProjectCover";
import { Button } from "../../components/ui/Button";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { RenameModal } from "./RenameModal";
import { BoardCard, BoardList, type TypeFilter } from "./BoardList";
import { CreateBoardModal } from "./CreateBoardModal";
import { boardEditedAt } from "./boardTypes";
import "./dashboard.css";

export function DashboardScreen() {
  const meta = useProject((s) => s.meta);
  const projectPath = useProject((s) => s.projectPath);
  if (!meta || !projectPath) return null;
  return (
    <FolderLayout
      parentId={null}
      title={meta.name}
      description={meta.description}
      facts={[meta.status, meta.genre]}
      cover={
        <ProjectCover path={projectPath} name={meta.name} coverImage={meta.coverImage} color={meta.color} size={64} />
      }
      showRecent
    />
  );
}

/** Shared by Home (project root) and FolderScreen (one folder). */
export function FolderLayout({
  parentId,
  title,
  description,
  facts = [],
  cover,
  showRecent,
}: {
  parentId: string | null;
  title: string;
  description?: string;
  facts?: string[];
  cover?: ReactNode;
  showRecent?: boolean;
}) {
  const treeItems = useProject((s) => s.treeItems);
  const boardsData = useProject((s) => s.boards);
  const notes = useNotes((s) => s.notes);
  const [filter, setFilter] = useState<TypeFilter>("all");
  const [creating, setCreating] = useState(false);
  const [newFolder, setNewFolder] = useState(false);
  const createFolder = useProject((s) => s.createFolder);

  const boards = subtreeBoards(treeItems, parentId);
  const count = (t: TypeFilter) => boards.filter((b) => t === "all" || b.boardType === t).length;

  let edited = "";
  for (const b of boards) {
    const e = boardEditedAt(boardsData[b.id], notes);
    if (e && e > edited) edited = e;
  }
  const recent =
    showRecent && boards.length >= 8
      ? [...boards]
          .map((b) => ({ b, at: boardEditedAt(boardsData[b.id], notes) ?? "" }))
          .sort((x, y) => y.at.localeCompare(x.at))
          .slice(0, 4)
          .map((x) => x.b)
      : [];

  const factLine = [
    ...facts.filter(Boolean),
    `${boards.length} ${boards.length === 1 ? "board" : "boards"}`,
    edited && `Edited ${agoLong(edited)}`,
  ].filter(Boolean);

  return (
    <AppShell actions={<PrimaryAction label="New board" onClick={() => setCreating(true)} />}>
      <div className="page">
        <header className="dhead">
          {cover ?? (
            <span className="dhead__folder" aria-hidden>
              <Folder size={30} strokeWidth={1.5} />
            </span>
          )}
          <div className="dhead__text">
            <h1 className="page__title">{title}</h1>
            {description && <p className="dhead__desc">{description}</p>}
            <p className="dhead__facts">{factLine.join(" · ")}</p>
          </div>
        </header>

        {recent.length > 0 && (
          <section className="dsection">
            <h2 className="section-title">Recently edited</h2>
            <div className="bgrid">
              {recent.map((b) => (
                <BoardCard key={b.id} board={b} />
              ))}
            </div>
          </section>
        )}

        <section className="dsection">
          <div className="dsection__head">
            <h2 className="section-title">{parentId ? "In this folder" : "Boards"}</h2>
            {boards.length > 0 && (
              <SegmentedControl<TypeFilter>
                label="Show boards by type"
                value={filter}
                onChange={setFilter}
                segments={FILTERS.map(([value, label]) => ({ value, label, count: count(value) }))}
              />
            )}
            <Button variant="ghost" size="sm" className="dsection__folder" onClick={() => setNewFolder(true)}>
              <FolderPlus size={15} strokeWidth={1.75} />
              New folder
            </Button>
          </div>
          <BoardList parentId={parentId} filter={filter} />
        </section>
      </div>

      {creating && <CreateBoardModal parentId={parentId} onClose={() => setCreating(false)} />}
      {newFolder && (
        <RenameModal
          item={null}
          title="New folder"
          confirmLabel="Create"
          initialValue=""
          placeholder="Worldbuilding"
          onSubmit={(name) => createFolder(parentId, name)}
          onClose={() => setNewFolder(false)}
        />
      )}
    </AppShell>
  );
}

const FILTERS: [TypeFilter, string][] = [
  ["all", "All"],
  ["plotline", "Plot Lines"],
  ["infomap", "Info Maps"],
  ["notes", "Notes"],
];

function subtreeBoards(items: TreeItem[], rootId: string | null): TreeBoard[] {
  const inside = new Set<string | null>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const it of items) {
      if (it.kind === "folder" && inside.has(it.parentId) && !inside.has(it.id)) {
        inside.add(it.id);
        grew = true;
      }
    }
  }
  return items.filter((it): it is TreeBoard => it.kind === "board" && inside.has(it.parentId));
}
