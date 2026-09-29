import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { useNoteModal } from "./noteModalStore";
import { useNotes, refcountOf } from "../../stores/notesStore";
import { useProject } from "../../stores/projectStore";
import { IconButton } from "../../components/ui/Button";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { longDate } from "../../lib/time";
import { CategoryChip } from "../../components/ui/CategoryChip";
import { CategoryPicker } from "../../components/ui/CategoryPicker";
import { NoteEditor } from "./NoteEditor";
import { RichTextToolbar } from "./RichTextToolbar";
import { AttachmentList } from "./AttachmentList";
import type { MenuPosition } from "../../components/ui/Menu";
import "./notePopup.css";

/* Rendered once in App; opens whenever noteModalStore has a noteId. */

export function NotePopupHost() {
  const noteId = useNoteModal((s) => s.noteId);
  if (!noteId) return null;
  return <NotePopup key={noteId} noteId={noteId} />;
}

function NotePopup({ noteId }: { noteId: string }) {
  const note = useNotes((s) => s.notes[noteId]);
  const updateNote = useNotes((s) => s.updateNote);
  const mode = useNoteModal((s) => s.mode);
  const setMode = useNoteModal((s) => s.setMode);
  const close = useNoteModal((s) => s.close);
  const boards = useProject((s) => s.boards);
  const categories = useProject((s) => s.meta?.categories ?? []);

  const [editor, setEditor] = useState<Editor | null>(null);
  const [catPicker, setCatPicker] = useState<MenuPosition | null>(null);
  // Ignore backdrop clicks briefly after opening: a double-click on a note row
  // otherwise opens the popup on click 1 and closes it on click 2.
  const openedAt = useRef(Date.now());

  const refcount = refcountOf(noteId, boards);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !catPicker) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, catPicker]);

  const onEditorReady = useCallback((ed: Editor | null) => setEditor(ed), []);

  if (!note) return null;

  const noteCategories = note.categoryIds
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && Date.now() - openedAt.current > 350) close();
      }}
    >
      <div className="notepopup" role="dialog" aria-label={note.title || "Note"}>
        <div className="notepopup__bar">
          <SegmentedControl
            className="notepopup__seg"
            label="Mode"
            value={mode}
            onChange={setMode}
            segments={[
              { value: "read", label: "Read" },
              { value: "edit", label: "Edit" },
            ]}
          />
          {refcount > 1 && (
            <span
              className="pill pill--accent"
              title="This note appears in more than one place. Edits show everywhere."
            >
              Linked · {refcount} places
            </span>
          )}
          <IconButton label="Close" className="notepopup__close" onClick={close}>
            <X size={17} strokeWidth={1.75} />
          </IconButton>
        </div>

        <div className="notepopup__body">
          {mode === "edit" ? (
            <input
              className="notepopup__title"
              placeholder="Untitled note"
              value={note.title}
              autoFocus={note.title === ""}
              onChange={(e) => updateNote(noteId, { title: e.target.value })}
            />
          ) : (
            <h2 className="notepopup__title">{note.title || "Untitled note"}</h2>
          )}

          {(noteCategories.length > 0 || mode === "edit") && (
            <div className="notepopup__chips">
              {noteCategories.map((c) => (
                <CategoryChip key={c.id} category={c} />
              ))}
              {mode === "edit" && (
                <button
                  className="notepopup__addcat"
                  onClick={(e) => setCatPicker({ x: e.clientX, y: e.clientY })}
                >
                  + Category
                </button>
              )}
            </div>
          )}

          {mode === "edit" && <RichTextToolbar editor={editor} />}

          <NoteEditor
            doc={note.doc}
            editable={mode === "edit"}
            onDocChange={(doc) => updateNote(noteId, { doc })}
            onEditor={onEditorReady}
            onRequestEdit={() => setMode("edit")}
          />

          <AttachmentList note={note} editable={mode === "edit"} />
        </div>

        <div className="notepopup__foot">
          <span>Created {longDate(note.createdAt)}</span>
          <span>Edited {longDate(note.modifiedAt, true)}</span>
        </div>
      </div>

      {catPicker && (
        <CategoryPicker
          position={catPicker}
          selectedIds={note.categoryIds}
          onToggle={(catId) =>
            updateNote(noteId, {
              categoryIds: note.categoryIds.includes(catId)
                ? note.categoryIds.filter((id) => id !== catId)
                : [...note.categoryIds, catId],
            })
          }
          onClose={() => setCatPicker(null)}
        />
      )}
    </div>,
    document.body,
  );
}
