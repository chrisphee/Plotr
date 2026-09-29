import { useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { openPath } from "@tauri-apps/plugin-opener";
import { FileText, Paperclip, Pin, X } from "lucide-react";
import { useNotes } from "../../stores/notesStore";
import { useProject } from "../../stores/projectStore";
import { useConnectors } from "../connectors/connectorStore";
import { PinterestPicker } from "../connectors/PinterestPicker";
import { assetUrl, importAttachment, type AttachmentMeta } from "../../tauri/commands";
import { makeId } from "../../lib/ids";
import { IconButton } from "../../components/ui/Button";
import type { Note } from "../../lib/schema";
import "./notePopup.css";

/* Files are imported (copied) into the project's assets folder — the note
   never depends on the file's original disk location. */

export function AttachmentList({ note, editable }: { note: Note; editable: boolean }) {
  const updateNote = useNotes((s) => s.updateNote);
  const projectPath = useProject((s) => s.projectPath);
  const pinterestConnected = useConnectors((s) => s.pinterest.connected);
  const [pickerOpen, setPickerOpen] = useState(false);

  const appendMetas = (metas: AttachmentMeta[]) => {
    const current = useNotes.getState().notes[note.id];
    if (!current) return;
    const added = metas.map((m) => ({
      id: makeId("att"),
      path: m.rel_path,
      fileName: m.file_name,
      size: m.size,
      mime: m.mime,
    }));
    updateNote(note.id, { attachments: [...current.attachments, ...added] });
  };

  const attach = async () => {
    if (!projectPath) return;
    const picked = await openDialog({ multiple: true, title: "Attach files" });
    const paths = Array.isArray(picked) ? picked : picked ? [picked] : [];
    if (paths.length === 0) return;
    const current = useNotes.getState().notes[note.id];
    if (!current) return;
    const added = await Promise.all(
      paths.map(async (p) => {
        const meta = await importAttachment(projectPath, p as string);
        return {
          id: makeId("att"),
          path: meta.rel_path,
          fileName: meta.file_name,
          size: meta.size,
          mime: meta.mime,
        };
      }),
    );
    updateNote(note.id, { attachments: [...current.attachments, ...added] });
  };

  const remove = (attId: string) => {
    updateNote(note.id, { attachments: note.attachments.filter((a) => a.id !== attId) });
  };

  const openFile = (relPath: string) => {
    if (!projectPath) return;
    const sep = projectPath.includes("\\") ? "\\" : "/";
    void openPath(projectPath + sep + relPath.replace(/\//g, sep));
  };

  if (note.attachments.length === 0 && !editable) return null;

  return (
    <div className="attachments">
      {note.attachments.map((a) => (
        <div key={a.id} className="attachrow">
          <span className="attachrow__thumb">
            {a.mime.startsWith("image/") && projectPath ? (
              <img src={assetUrl(projectPath, a.path)} alt="" />
            ) : (
              <FileText size={15} strokeWidth={1.75} />
            )}
          </span>
          <span className="attachrow__text">
            <button className="attachrow__name" onClick={() => openFile(a.path)} title="Open file">
              {a.fileName}
            </button>
            <span className="attachrow__meta">{formatSize(a.size)}</span>
          </span>
          {editable && (
            <IconButton label="Remove attachment" onClick={() => remove(a.id)}>
              <X size={15} strokeWidth={1.75} />
            </IconButton>
          )}
        </div>
      ))}
      {editable && (
        <div className="attachments__add">
          <button className="notepage__add" onClick={() => void attach()}>
            <Paperclip size={13} strokeWidth={2} />
            Attach file
          </button>
          {pinterestConnected && (
            <button className="notepage__add" onClick={() => setPickerOpen(true)}>
              <Pin size={13} strokeWidth={2} />
              From Pinterest
            </button>
          )}
        </div>
      )}
      {pickerOpen && (
        <PinterestPicker onImported={appendMetas} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
