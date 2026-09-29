import { useState } from "react";
import clsx from "clsx";
import { useNav } from "../../app/navStore";
import { useProject } from "../../stores/projectStore";
import { useNotes } from "../../stores/notesStore";
import { useSettings } from "../../stores/settingsStore";
import { useSaveState } from "../../lib/saveQueue";
import { agoLong } from "../../lib/time";
import type { TreeBoard, TreeItem } from "../../lib/schema";
import { AppShell, PrimaryAction } from "../../components/shell/TopBar";
import { Button } from "../../components/ui/Button";
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
      slug={[meta.status, meta.genre].filter(Boolean).join(" · ")}
      lede={meta.description}
    />
  );
}

/** Shared by the dashboard (project root) and FolderScreen (one folder). */
export function FolderLayout({
  parentId,
  title,
  slug,
  lede,
}: {
  parentId: string | null;
  title: string;
  /** Typewritten line above the title, e.g. "Drafting · Literary mystery". */
  slug?: string;
  lede?: string;
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
      <div className="page page--margin">
        <div className="page__main">
          <div className="page__head">
            <h1 className="page__title">{title}</h1>
            {lede && <p className="page__lede">{lede}</p>}
            <MetaLine slug={slug} boardCount={boards.length} />
          </div>

          <BoardList parentId={parentId} filter={filter} />
        </div>

        {boards.length > 0 && (
          <aside className="page__side" aria-label="Show boards by type">
            <h2 className="page__sidelabel">Show</h2>
            <div className="sidefilter" role="radiogroup" aria-label="Board type">
              {FILTERS.map(([value, label]) => (
                <button
                  key={value}
                  role="radio"
                  aria-checked={filter === value}
                  className={clsx("sidefilter__item", filter === value && "sidefilter__item--on")}
                  onClick={() => setFilter(value)}
                  disabled={value !== "all" && count(value) === 0}
                >
                  <span>{label}</span>
                  <span className="sidefilter__count">{count(value)}</span>
                </button>
              ))}
            </div>
          </aside>
        )}
      </div>

      {creating && <CreateBoardModal parentId={parentId} onClose={() => setCreating(false)} />}
    </AppShell>
  );
}

const FILTERS: [TypeFilter, string][] = [
  ["all", "All boards"],
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

function MetaLine({ slug, boardCount }: { slug?: string; boardCount: number }) {
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
      {slug && <span>{slug} ·</span>}
      <span className={unsaved ? "statusdot statusdot--pending" : "statusdot"} />
      {state} · {boardCount} {boardCount === 1 ? "board" : "boards"}
      {edited && ` · edited ${agoLong(edited)}`}
    </div>
  );
}
