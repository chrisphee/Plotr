import { Fragment, useEffect, useReducer, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Underline,
} from "lucide-react";
import clsx from "clsx";
import { useProject } from "../../stores/projectStore";
import { importAttachment } from "../../tauri/commands";
import "./noteEditor.css";

interface Tool {
  label: string;
  icon: ReactNode;
  active: boolean;
  run: () => void;
}

const ICON = { size: 15, strokeWidth: 1.75 };

export function RichTextToolbar({ editor }: { editor: Editor | null }) {
  // Re-render on every editor transaction so active states stay current.
  const [, force] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!editor) return;
    editor.on("transaction", force);
    editor.on("selectionUpdate", force);
    return () => {
      editor.off("transaction", force);
      editor.off("selectionUpdate", force);
    };
  }, [editor]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const insertImage = async () => {
    const projectPath = useProject.getState().projectPath;
    if (!projectPath) return;
    const picked = await openDialog({
      title: "Insert image",
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"] }],
    });
    if (typeof picked !== "string") return;
    const meta = await importAttachment(projectPath, picked);
    editor.chain().focus().setImage({ src: meta.rel_path }).run();
  };

  const c = () => editor.chain().focus();

  const groups: Tool[][] = [
    [
      { label: "Bold", icon: <Bold {...ICON} />, active: editor.isActive("bold"), run: () => c().toggleBold().run() },
      { label: "Italic", icon: <Italic {...ICON} />, active: editor.isActive("italic"), run: () => c().toggleItalic().run() },
      { label: "Underline", icon: <Underline {...ICON} />, active: editor.isActive("underline"), run: () => c().toggleUnderline().run() },
    ],
    [
      { label: "Heading 1", icon: <Heading1 {...ICON} />, active: editor.isActive("heading", { level: 1 }), run: () => c().toggleHeading({ level: 1 }).run() },
      { label: "Heading 2", icon: <Heading2 {...ICON} />, active: editor.isActive("heading", { level: 2 }), run: () => c().toggleHeading({ level: 2 }).run() },
      { label: "Heading 3", icon: <Heading3 {...ICON} />, active: editor.isActive("heading", { level: 3 }), run: () => c().toggleHeading({ level: 3 }).run() },
    ],
    [
      { label: "Bullet list", icon: <List {...ICON} />, active: editor.isActive("bulletList"), run: () => c().toggleBulletList().run() },
      { label: "Numbered list", icon: <ListOrdered {...ICON} />, active: editor.isActive("orderedList"), run: () => c().toggleOrderedList().run() },
      { label: "Checklist", icon: <ListChecks {...ICON} />, active: editor.isActive("taskList"), run: () => c().toggleTaskList().run() },
      { label: "Quote", icon: <Quote {...ICON} />, active: editor.isActive("blockquote"), run: () => c().toggleBlockquote().run() },
    ],
    [
      { label: "Link", icon: <LinkIcon {...ICON} />, active: editor.isActive("link"), run: setLink },
      { label: "Image", icon: <ImageIcon {...ICON} />, active: false, run: () => void insertImage() },
    ],
    [
      { label: "Align left", icon: <AlignLeft {...ICON} />, active: editor.isActive({ textAlign: "left" }), run: () => c().setTextAlign("left").run() },
      { label: "Align centre", icon: <AlignCenter {...ICON} />, active: editor.isActive({ textAlign: "center" }), run: () => c().setTextAlign("center").run() },
      { label: "Align right", icon: <AlignRight {...ICON} />, active: editor.isActive({ textAlign: "right" }), run: () => c().setTextAlign("right").run() },
    ],
  ];

  return (
    <div className="rt-toolbar">
      {groups.map((group, gi) => (
        <Fragment key={gi}>
          {gi > 0 && <span className="rt-toolbar__sep" />}
          {group.map((t) => (
            <button
              key={t.label}
              className={clsx("rt-toolbar__btn", t.active && "rt-toolbar__btn--active")}
              title={t.label}
              aria-label={t.label}
              onMouseDown={(e) => {
                e.preventDefault(); // keep editor selection
                t.run();
              }}
            >
              {t.icon}
            </button>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
