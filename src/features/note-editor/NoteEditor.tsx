import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useRef } from "react";
import { WikiLink, handleWikiLinkClick } from "./tiptap/WikiLink";
import { ProjectImage } from "./tiptap/ProjectImage";
import { useProject } from "../../stores/projectStore";
import { importAttachmentBytes } from "../../tauri/commands";
import "./noteEditor.css";

export function buildExtensions() {
  return [
    StarterKit.configure({
      link: { openOnClick: false },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    ProjectImage,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    WikiLink,
  ];
}

/** Import pasted/dropped image files and insert them at the cursor. */
function insertImageFiles(editor: Editor, files: FileList | File[]): boolean {
  const projectPath = useProject.getState().projectPath;
  if (!projectPath) return false;
  const images = [...files].filter((f) => f.type.startsWith("image/"));
  if (images.length === 0) return false;
  for (const file of images) {
    void file.arrayBuffer().then(async (buf) => {
      const meta = await importAttachmentBytes(
        projectPath,
        file.name || "pasted.png",
        [...new Uint8Array(buf)],
      );
      editor.chain().focus().setImage({ src: meta.rel_path }).run();
    });
  }
  return true;
}

interface NoteEditorProps {
  doc: unknown;
  editable: boolean;
  onDocChange?: (doc: unknown) => void;
  onEditor?: (editor: Editor | null) => void;
  /** Fires when the user double-clicks a read-only editor (open edit mode). */
  onRequestEdit?: () => void;
}

export function NoteEditor({ doc, editable, onDocChange, onEditor, onRequestEdit }: NoteEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  const editor = useEditor(
    {
      extensions: buildExtensions(),
      content: doc as never,
      editable,
      onUpdate: ({ editor }) => onDocChange?.(editor.getJSON()),
      editorProps: {
        handleClick: (_view, _pos, event) => handleWikiLinkClick(event.target),
        handlePaste: (_view, event) => {
          const files = event.clipboardData?.files;
          const ed = editorRef.current;
          if (editable && ed && files && files.length > 0 && insertImageFiles(ed, files)) {
            event.preventDefault();
            return true;
          }
          return false;
        },
        handleDrop: (_view, event) => {
          const files = event.dataTransfer?.files;
          const ed = editorRef.current;
          if (editable && ed && files && files.length > 0 && insertImageFiles(ed, files)) {
            event.preventDefault();
            return true;
          }
          return false;
        },
      },
    },
    // Recreate when switching notes or modes; content is set from props then.
    [editable],
  );

  useEffect(() => {
    editorRef.current = editor;
    onEditor?.(editor);
    return () => onEditor?.(null);
  }, [editor, onEditor]);

  return (
    <div
      className={`note-editor ${editable ? "note-editor--edit" : "note-editor--read"}`}
      onDoubleClick={() => !editable && onRequestEdit?.()}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
