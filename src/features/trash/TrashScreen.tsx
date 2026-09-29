import { useState } from "react";
import { Folder, Image as ImageIcon, LayoutGrid, RotateCcw, StickyNote, Trash2, TrendingUp, X } from "lucide-react";
import { useProject } from "../../stores/projectStore";
import { notesBoard } from "../notes-board/notesBoardActions";
import { plotline } from "../plotline/plotActions";
import { infomap } from "../infomap/infomapActions";
import { emptyTrash, purgeTrashEntry } from "./trashActions";
import type { TrashEntry, TreeItem } from "../../lib/schema";
import { shortDate } from "../../lib/time";
import { boardTypeInfo } from "../dashboard/boardTypes";
import { AppShell } from "../../components/shell/TopBar";
import { Button, IconButton } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import "./trash.css";

const ICON = { size: 16, strokeWidth: 1.75 };

function entryIcon(e: TrashEntry) {
  switch (e.kind) {
    case "treeItem": {
      const first = (e.payload.treeItems as TreeItem[] | undefined)?.[0];
      if (first?.kind === "board") return boardTypeInfo(first.boardType).icon(16);
      return <Folder {...ICON} />;
    }
    case "noteRef":
      return <StickyNote {...ICON} />;
    case "notesFolder":
      return <Folder {...ICON} />;
    case "plotPoint":
      return <TrendingUp {...ICON} />;
    case "canvasItem":
      return e.noteId ? <StickyNote {...ICON} /> : <ImageIcon {...ICON} />;
  }
  return <LayoutGrid {...ICON} />;
}

export function TrashScreen() {
  const trash = useProject((s) => s.trash);
  const restoreTreeItem = useProject((s) => s.restoreTrashEntry);
  const [purging, setPurging] = useState<TrashEntry | null>(null);
  const [emptying, setEmptying] = useState(false);

  const restore = (entry: TrashEntry) => {
    switch (entry.kind) {
      case "treeItem":
        restoreTreeItem(entry.id);
        break;
      case "noteRef":
        notesBoard.restoreRefEntry(entry.id);
        break;
      case "notesFolder":
        notesBoard.restoreFolderEntry(entry.id);
        break;
      case "plotPoint":
        plotline.restorePointEntry(entry.id);
        break;
      case "canvasItem":
        infomap.restoreCanvasEntry(entry.id);
        break;
    }
  };

  return (
    <AppShell
      largeTitle
      subtitle={trash.entries.length ? `${trash.entries.length} ${trash.entries.length === 1 ? "item" : "items"}` : undefined}
      actions={
        trash.entries.length > 0 && (
          <Button variant="ink" onClick={() => setEmptying(true)}>
            <Trash2 size={15} strokeWidth={1.75} />
            Empty Trash
          </Button>
        )
      }
    >
      <div className="page page--narrow">
        <div className="page__head">
          <h1 className="page__title">Trash</h1>
          <p className="page__sub">Deleted boards, folders and notes wait here until you restore or remove them.</p>
        </div>

        {trash.entries.length === 0 ? (
          <EmptyState
            icon={<Trash2 size={22} strokeWidth={1.75} />}
            title="Trash is empty"
            message="Anything you delete from this project shows up here first."
          />
        ) : (
          <div className="trash__list">
            {trash.entries.map((e) => (
              <div key={e.id} className="trashrow">
                <span className="trashrow__icon">{entryIcon(e)}</span>
                <div className="trashrow__text">
                  <span className="trashrow__name">{e.displayName}</span>
                  <span className="trashrow__from">
                    {e.originPath.length > 0 ? e.originPath.join(" › ") : "Project root"} · Deleted{" "}
                    {deletedWhen(e.deletedAt)}
                  </span>
                </div>
                <Button variant="accent" size="sm" onClick={() => restore(e)}>
                  <RotateCcw size={13} strokeWidth={2} />
                  Restore
                </Button>
                <IconButton label={`Delete ${e.displayName} permanently`} onClick={() => setPurging(e)}>
                  <X size={16} strokeWidth={2} />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </div>

      {purging && (
        <ConfirmDialog
          title="Delete permanently?"
          message={`"${purging.displayName}" will be removed for good. This cannot be undone.`}
          confirmLabel="Delete permanently"
          destructive
          onConfirm={() => {
            void purgeTrashEntry(purging.id);
            setPurging(null);
          }}
          onCancel={() => setPurging(null)}
        />
      )}
      {emptying && (
        <ConfirmDialog
          title="Empty Trash?"
          message="Everything in the Trash will be removed for good, including any notes and files no longer used anywhere. This cannot be undone."
          confirmLabel="Empty Trash"
          destructive
          onConfirm={() => {
            void emptyTrash();
            setEmptying(false);
          }}
          onCancel={() => setEmptying(false)}
        />
      )}
    </AppShell>
  );
}

function deletedWhen(iso: string) {
  const d = shortDate(iso);
  return d === "Yesterday" || d === "Just now" ? d.toLowerCase() : d;
}
