import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { useNoteModal } from "./noteModalStore";
import { useNotes } from "../../stores/notesStore";
import { useProject } from "../../stores/projectStore";
import { useNav } from "../../app/navStore";
import { IconButton } from "../../components/ui/Button";
import { useFocusTrap } from "../../components/ui/focusTrap";
import { longDate } from "../../lib/time";
import type { Board, TreeItem } from "../../lib/schema";
import { CategoryChip } from "../../components/ui/CategoryChip";
import { CategoryPicker } from "../../components/ui/CategoryPicker";
import { NoteEditor } from "./NoteEditor";
import { RichTextToolbar } from "./RichTextToolbar";
import { AttachmentList } from "./AttachmentList";
import type { MenuPosition } from "../../components/ui/Menu";
import "./notePopup.css";

/* Rendered once in App; opens whenever noteModalStore has a noteId. The note
   is a page laid over the board: always editable, with its details in the
   margin. "edit" mode only means the caret starts in the text. */

export function NotePopupHost() {
  const noteId = useNoteModal((s) => s.noteId);
  if (!noteId) return null;
  return <NotePopup key={noteId} noteId={noteId} />;
}

function NotePopup({ noteId }: { noteId: string }) {
  const note = useNotes((s) => s.notes[noteId]);
  const updateNote = useNotes((s) => s.updateNote);
  const startInText = useNoteModal((s) => s.mode === "edit");
  const close = useNoteModal((s) => s.close);
  const boards = useProject((s) => s.boards);
  const treeItems = useProject((s) => s.treeItems);
  const categories = useProject((s) => s.meta?.categories ?? []);

  const [editor, setEditor] = useState<Editor | null>(null);
  const [catPicker, setCatPicker] = useState<MenuPosition | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  // Ignore backdrop clicks briefly after opening: a double-click on a note row
  // otherwise opens the page on click 1 and closes it on click 2.
  const openedAt = useRef(Date.now());

  useFocusTrap(sheetRef);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !catPicker) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, catPicker]);

  const caretPlaced = useRef(false);
  useEffect(() => {
    if (caretPlaced.current || !startInText || !editor || !note?.title) return;
    caretPlaced.current = true;
    editor.commands.focus("end");
  }, [startInText, editor, note?.title]);

  const onEditorReady = useCallback((ed: Editor | null) => setEditor(ed), []);

  if (!note) return null;

  const noteCategories = note.categoryIds
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const places = placesOf(noteId, boards, treeItems);

  const goTo = (boardId: string) => {
    close();
    useNav.getState().navigate({ name: "board", boardId });
  };

  return createPortal(
    <div
      className="notepage-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && Date.now() - openedAt.current > 350) close();
      }}
    >
      <div
        ref={sheetRef}
        className="notepage"
        role="dialog"
        aria-modal="true"
        aria-label={note.title || "Note"}
        tabIndex={-1}
        data-autofocus={note.title !== "" && !startInText ? "" : undefined}
      >
        <div className="notepage__bar">
          <RichTextToolbar editor={editor} />
          <IconButton label="Close (Esc)" className="notepage__close" onClick={close}>
            <X size={17} strokeWidth={1.75} />
          </IconButton>
        </div>

        <div className="notepage__scroll">
          <div className="notepage__grid">
            <article className="notepage__main">
              <input
                className="notepage__title"
                placeholder="Untitled note"
                aria-label="Note title"
                value={note.title}
                data-autofocus={note.title === "" ? "" : undefined}
                onChange={(e) => updateNote(noteId, { title: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "ArrowDown") {
                    e.preventDefault();
                    editor?.commands.focus("start");
                  }
                }}
              />
              <NoteEditor
                doc={note.doc}
                editable
                onDocChange={(doc) => updateNote(noteId, { doc })}
                onEditor={onEditorReady}
              />
              <AttachmentList note={note} editable />
            </article>

            <aside className="notepage__margin" aria-label="Note details">
              <section className="notepage__note">
                <h3 className="notepage__label">Categories</h3>
                <div className="notepage__cats">
                  {noteCategories.map((c) => (
                    <CategoryChip key={c.id} category={c} />
                  ))}
                  <button
                    className="notepage__add"
                    onClick={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setCatPicker({ x: r.left, y: r.bottom + 4 });
                    }}
                  >
                    {noteCategories.length ? "Change" : "+ Add category"}
                  </button>
                </div>
              </section>

              {places.length > 0 && (
                <section className="notepage__note">
                  <h3 className="notepage__label">
                    {places.length > 1 ? `Linked in ${places.length} places` : "Appears in"}
                  </h3>
                  <ul className="notepage__places">
                    {places.map((p) => (
                      <li key={p.boardId}>
                        <button className="notepage__place" onClick={() => goTo(p.boardId)}>
                          {p.name}
                          {p.count > 1 && <span className="notepage__placecount"> ×{p.count}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="notepage__note notepage__dates">
                <span>Created {longDate(note.createdAt)}</span>
                <span>Edited {longDate(note.modifiedAt, true)}</span>
              </section>
            </aside>
          </div>
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

/** Every board that shows this note, by name, with how many copies it holds. */
function placesOf(noteId: string, boards: Record<string, Board>, tree: TreeItem[]) {
  const out: { boardId: string; name: string; count: number }[] = [];
  for (const board of Object.values(boards)) {
    const count =
      board.type === "notes"
        ? board.noteRefs.filter((r) => r.noteId === noteId).length
        : board.type === "plotline"
          ? board.points.filter((p) => p.noteId === noteId).length
          : board.items.filter((i) => i.kind === "note" && i.noteId === noteId).length;
    if (count === 0) continue;
    const name = tree.find((t) => t.id === board.id)?.name ?? "Board";
    out.push({ boardId: board.id, name, count });
  }
  return out;
}
