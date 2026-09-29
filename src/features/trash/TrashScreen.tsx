import { useState } from "react";
import { X } from "lucide-react";
import { useProject } from "../../stores/projectStore";
import { notesBoard } from "../notes-board/notesBoardActions";
import { plotline } from "../plotline/plotActions";
import { infomap } from "../infomap/infomapActions";
import { emptyTrash, purgeTrashEntry } from "./trashActions";
import type { TrashEntry } from "../../lib/schema";
import { shortDate } from "../../lib/time";
import { AppShell } from "../../components/shell/TopBar";
import { Button, IconButton } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/Modal";
import "./trash.css";

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
      actions={
        trash.entries.length > 0 && (
          <Button variant="ink" onClick={() => setEmptying(true)}>
            Empty trash
          </Button>
        )
      }
    >
      <div className="page">
        <div className="page__head trash__head">
          <h1 className="page__title page__title--settings">Trash</h1>
          <p className="page__sub">
            {trash.entries.length === 0 && "Trash is empty. "}
            Deleted boards, folders and notes wait here until you restore or remove them.
          </p>
        </div>

        {trash.entries.length > 0 && (
          <div className="lgroup trash__list">
            {trash.entries.map((e) => (
              <div key={e.id} className="lrow trashrow">
                <div className="trashrow__text">
                  <span className="lrow__name">{e.displayName}</span>
                  <span className="lrow__mono trashrow__from">
                    {e.originPath.length > 0 ? e.originPath.join(" › ") : "Project root"} · deleted{" "}
                    {deletedWhen(e.deletedAt)}
                  </span>
                </div>
                <Button variant="accent" onClick={() => restore(e)}>
                  Restore
                </Button>
                <IconButton label="Delete permanently" onClick={() => setPurging(e)}>
                  <X size={16} strokeWidth={1.75} />
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
          title="Empty trash?"
          message="Everything in the Trash will be removed for good, including any notes and files no longer used anywhere. This cannot be undone."
          confirmLabel="Empty trash"
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
