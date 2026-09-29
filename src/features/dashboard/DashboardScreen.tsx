import { useState, type ReactNode } from "react";
import { useNav } from "../../app/navStore";
import { useProject } from "../../stores/projectStore";
import { useNotes } from "../../stores/notesStore";
import { useSettings } from "../../stores/settingsStore";
import { useSaveState } from "../../lib/saveQueue";
import { agoLong } from "../../lib/time";
import type { TreeBoard, TreeItem } from "../../lib/schema";
import { AppShell, PrimaryAction } from "../../components/shell/TopBar";
import { Button } from "../../components/ui/Button";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { BoardList, type TypeFilter } from "./BoardList";
import { CreateBoardModal } from "./CreateBoardModal";
import "./dashboard.css";

export function DashboardScreen() {
  const meta = useProject((s) => s.meta);
  if (!meta) return null;
  return (
    <FolderLayout
      parentId={null}
      title={meta.name}
      chips={
        (meta.status || meta.genre) && (
          <div className="dash__chips">
            {meta.status && <span className="pill pill--accent">{meta.status}</span>}
            {meta.genre && <span className="pill pill--ring">{meta.genre}</span>}
          </div>
        )
      }
    />
  );
}

/** Shared by the dashboard (project root) and FolderScreen (one folder). */
export function FolderLayout({
  parentId,
  title,
  chips,
}: {
  parentId: string | null;
  title: string;
  chips?: ReactNode;
}) {
  const navigate = useNav((s) => s.navigate);
  const treeItems = useProject((s) => s.treeItems);
  const [filter, setFilter] = useState<TypeFilter>("all");
  const [creating, setCreating] = useState(false);

  const boards = subtreeBoards(treeItems, parentId);
  const count = (t: TypeFilter) => boards.filter((b) => t === "all" || b.boardType === t).length;

  return (
    <AppShell
      actions={
        <>
          <Button variant="ghost" onClick={() => navigate({ name: "trash" })}>
            Trash
          </Button>
          <Button variant="ghost" onClick={() => navigate({ name: "projectSettings" })}>
            Settings
          </Button>
          <PrimaryAction label="New board" onClick={() => setCreating(true)} />
        </>
      }
    >
      <div className="page">
        <div className="page__head">
          {chips}
          <h1 className="page__title">{title}</h1>
          <MetaLine boardCount={boards.length} />
        </div>

        {boards.length > 0 && (
          <SegmentedControl
            className="dash__filter"
            label="Board type"
            value={filter}
            onChange={setFilter}
            segments={[
              { value: "all", label: "All", count: count("all") },
              { value: "plotline", label: "Plot Line", count: count("plotline") },
              { value: "infomap", label: "Info Map", count: count("infomap") },
              { value: "notes", label: "Notes", count: count("notes") },
            ]}
          />
        )}

        <BoardList parentId={parentId} filter={filter} />
      </div>

      {creating && <CreateBoardModal parentId={parentId} onClose={() => setCreating(false)} />}
    </AppShell>
  );
}

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

function MetaLine({ boardCount }: { boardCount: number }) {
  const meta = useProject((s) => s.meta);
  const notes = useNotes((s) => s.notes);
  const autosave = useSettings((s) => s.autosave);
  const pending = useSaveState((s) => s.pendingCount);

  let edited = meta?.modifiedAt ?? "";
  for (const n of Object.values(notes)) if (n.modifiedAt > edited) edited = n.modifiedAt;

  const unsaved = !autosave && pending > 0;
  const state = unsaved ? "Unsaved changes" : autosave ? "Autosaved" : "Saved";
  return (
    <div className="page__metaline">
      <span className={unsaved ? "statusdot statusdot--pending" : "statusdot"} />
      {state} · {boardCount} {boardCount === 1 ? "board" : "boards"}
      {edited && ` · edited ${agoLong(edited)}`}
    </div>
  );
}
