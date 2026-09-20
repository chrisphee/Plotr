import { useEffect, useReducer } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Underline,
} from "lucide-react";
import clsx from "clsx";
import "./noteEditor.css";

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

  const btn = (
    label: string,
    icon: React.ReactNode,
    active: boolean,
    run: () => void,
  ) => (
    <button
      className={clsx("rt-toolbar__btn", active && "rt-toolbar__btn--active")}
      title={label}
      aria-label={label}
      onMouseDown={(e) => {
        e.preventDefault(); // keep editor selection
        run();
      }}
    >
      {icon}
    </button>
  );

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

  const c = editor.chain().focus.bind(editor.chain());

  return (
    <div className="rt-toolbar">
      {btn("Bold", <Bold size={15} />, editor.isActive("bold"), () => c().toggleBold().run())}
      {btn("Italic", <Italic size={15} />, editor.isActive("italic"), () =>
        c().toggleItalic().run(),
      )}
      {btn("Underline", <Underline size={15} />, editor.isActive("underline"), () =>
        c().toggleUnderline().run(),
      )}
      <span className="rt-toolbar__sep" />
      {btn("Heading 1", <Heading1 size={15} />, editor.isActive("heading", { level: 1 }), () =>
        c().toggleHeading({ level: 1 }).run(),
      )}
      {btn("Heading 2", <Heading2 size={15} />, editor.isActive("heading", { level: 2 }), () =>
        c().toggleHeading({ level: 2 }).run(),
      )}
      {btn("Heading 3", <Heading3 size={15} />, editor.isActive("heading", { level: 3 }), () =>
        c().toggleHeading({ level: 3 }).run(),
      )}
      <span className="rt-toolbar__sep" />
      {btn("Bullet list", <List size={15} />, editor.isActive("bulletList"), () =>
        c().toggleBulletList().run(),
      )}
      {btn("Numbered list", <ListOrdered size={15} />, editor.isActive("orderedList"), () =>
        c().toggleOrderedList().run(),
      )}
      {btn("Checklist", <ListChecks size={15} />, editor.isActive("taskList"), () =>
        c().toggleTaskList().run(),
      )}
      {btn("Quote", <Quote size={15} />, editor.isActive("blockquote"), () =>
        c().toggleBlockquote().run(),
      )}
      <span className="rt-toolbar__sep" />
      {btn("Link", <LinkIcon size={15} />, editor.isActive("link"), setLink)}
      <span className="rt-toolbar__sep" />
      {btn("Align left", <AlignLeft size={15} />, editor.isActive({ textAlign: "left" }), () =>
        c().setTextAlign("left").run(),
      )}
      {btn(
        "Align centre",
        <AlignCenter size={15} />,
        editor.isActive({ textAlign: "center" }),
        () => c().setTextAlign("center").run(),
      )}
      {btn("Align right", <AlignRight size={15} />, editor.isActive({ textAlign: "right" }), () =>
        c().setTextAlign("right").run(),
      )}
    </div>
  );
}
