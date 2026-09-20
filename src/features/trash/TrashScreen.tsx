import { useState } from "react";
import { Trash2, Undo2, X } from "lucide-react";
import { useProject } from "../../stores/projectStore";
import { notesBoard } from "../notes-board/notesBoardActions";
import { plotline } from "../plotline/plotActions";
import { infomap } from "../infomap/infomapActions";
import { emptyTrash, purgeTrashEntry } from "./trashActions";
import type { TrashEntry } from "../../lib/schema";
import { Dock } from "../../components/shell/Dock";
import { EmptyState } from "../../components/ui/EmptyState";
import { Button, IconButton } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/Modal";
import "../dashboard/dashboard.css";
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
    <main className="shell__main" style={{ height: "100%" }}>
      <div className="dash__main" style={{ maxWidth: 720 }}>
        <div className="dash__header">
          <h1 className="dash__boardtitle">Trash</h1>
          {trash.entries.length > 0 && (
            <Button variant="destructive" onClick={() => setEmptying(true)}>
              <Trash2 size={14} /> Empty Trash
            </Button>
          )}
        </div>
        {trash.entries.length === 0 ? (
          <EmptyState
            icon={<Trash2 size={26} strokeWidth={1.5} />}
            title="Trash is empty"
            message="Deleted boards, folders and notes wait here until you restore or remove them."
          />
        ) : (
          <div className="trashlist">
            {trash.entries.map((e) => (
              <div key={e.id} className="trashrow">
                <div>
                  <div className="trashrow__name">{e.displayName}</div>
                  <div className="meta">
                    {e.originPath.length > 0 ? e.originPath.join(" › ") : "Project root"} ·
                    deleted {new Date(e.deletedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "var(--sp-3)", alignItems: "center" }}>
                  <Button variant="secondary" onClick={() => restore(e)}>
                    <Undo2 size={14} /> Restore
                  </Button>
                  <IconButton label="Delete permanently" onClick={() => setPurging(e)}>
                    <X size={15} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Dock />

      {purging && (
        <ConfirmDialog
          title="Delete permanently?"
          message={`"${purging.displayName}" will be removed for good. This cannot be undone.`}
          confirmLabel="Delete Permanently"
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
    </main>
  );
}
