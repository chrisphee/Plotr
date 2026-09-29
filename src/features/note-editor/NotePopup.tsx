import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { useNoteModal } from "./noteModalStore";
import { useNotes } from "../../stores/notesStore";
import { useProject } from "../../stores/projectStore";
import { useNav } from "../../app/navStore";
import { IconButton } from "../../components/ui/Button";
import { useFocusTrap } from "../../components/ui/focusTrap";
import { longDate } from "../../lib/time";
import { boardTypeInfo } from "../dashboard/boardTypes";
import type { Board, TreeItem } from "../../lib/schema";
import { CategoryChip } from "../../components/ui/CategoryChip";
import { CategoryPicker } from "../../components/ui/CategoryPicker";
import { NoteEditor } from "./NoteEditor";
import { RichTextToolbar } from "./RichTextToolbar";
import { AttachmentList } from "./AttachmentList";
import type { MenuPosition } from "../../components/ui/Menu";
import "./notePopup.css";

/* Rendered once in App; opens whenever noteModalStore has a noteId. The note
   is a document sheet over the board: always editable, with its details under
   the title. "edit" mode only means the caret starts in the text. */

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
      className="sheet-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && Date.now() - openedAt.current > 350) close();
      }}
    >
      <div
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={note.title || "Note"}
        tabIndex={-1}
        data-autofocus={note.title !== "" && !startInText ? "" : undefined}
      >
        <div className="sheet__bar">
          <RichTextToolbar editor={editor} />
          <IconButton label="Close (Esc)" className="sheet__close" onClick={close}>
            <X size={17} strokeWidth={2} />
          </IconButton>
        </div>

        <div className="sheet__scroll">
          <article className="doc">
            <input
              className="doc__title"
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

            <div className="doc__props" aria-label="Note details">
              <div className="doc__prop">
                <span className="doc__propname">Categories</span>
                <span className="doc__propvalue">
                  {noteCategories.map((c) => (
                    <CategoryChip key={c.id} category={c} />
                  ))}
                  <button
                    className="doc__chipbtn"
                    onClick={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setCatPicker({ x: r.left, y: r.bottom + 6 });
                    }}
                  >
                    {noteCategories.length ? (
                      "Edit"
                    ) : (
                      <>
                        <Plus size={13} strokeWidth={2.25} />
                        Add category
                      </>
                    )}
                  </button>
                </span>
              </div>

              {places.length > 0 && (
                <div className="doc__prop">
                  <span className="doc__propname">
                    {places.length > 1 ? `Linked in ${places.length} boards` : "Appears in"}
                  </span>
                  <span className="doc__propvalue">
                    {places.map((p) => (
                      <button key={p.boardId} className="doc__place" onClick={() => goTo(p.boardId)}>
                        {boardTypeInfo(p.type).icon(13)}
                        {p.name}
                        {p.count > 1 && <span className="doc__placecount">×{p.count}</span>}
                      </button>
                    ))}
                  </span>
                </div>
              )}

              <div className="doc__prop">
                <span className="doc__propname">Edited</span>
                <span className="doc__propvalue doc__dates" title={`Created ${longDate(note.createdAt)}`}>
                  {longDate(note.modifiedAt, true)}
                </span>
              </div>
            </div>

            <NoteEditor
              doc={note.doc}
              editable
              onDocChange={(doc) => updateNote(noteId, { doc })}
              onEditor={onEditorReady}
            />
            <AttachmentList note={note} editable />
          </article>
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
  const out: { boardId: string; name: string; type: Board["type"]; count: number }[] = [];
  for (const board of Object.values(boards)) {
    const count =
      board.type === "notes"
        ? board.noteRefs.filter((r) => r.noteId === noteId).length
        : board.type === "plotline"
          ? board.points.filter((p) => p.noteId === noteId).length
          : board.items.filter((i) => i.kind === "note" && i.noteId === noteId).length;
    if (count === 0) continue;
    const name = tree.find((t) => t.id === board.id)?.name ?? "Board";
    out.push({ boardId: board.id, name, type: board.type, count });
  }
  return out;
}
