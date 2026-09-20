import { useState } from "react";
import { Handle, NodeResizer, Position, type NodeProps, type Node } from "@xyflow/react";
import { Link2 } from "lucide-react";
import clsx from "clsx";
import { useNotes, refcountOf } from "../../stores/notesStore";
import { useProject } from "../../stores/projectStore";
import { useNoteModal } from "../note-editor/noteModalStore";
import { assetUrl } from "../../tauri/commands";
import { extractPreview } from "../notes-board/preview";
import { CategoryDot } from "../../components/ui/CategoryChip";
import { infomap } from "./infomapActions";

/* Four sides, all "source" type — connectionMode="loose" lets any pair link. */
function Handles() {
  return (
    <>
      <Handle id="t" type="source" position={Position.Top} />
      <Handle id="r" type="source" position={Position.Right} />
      <Handle id="b" type="source" position={Position.Bottom} />
      <Handle id="l" type="source" position={Position.Left} />
    </>
  );
}

export type NoteNodeType = Node<{ boardId: string; noteId: string }, "note">;

export function NoteNode({ data, selected }: NodeProps<NoteNodeType>) {
  const note = useNotes((s) => s.notes[data.noteId]);
  const boards = useProject((s) => s.boards);
  const categories = useProject((s) => s.meta?.categories ?? []);
  if (!note) return null;

  const refcount = refcountOf(note.id, boards);
  const cats = note.categoryIds
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const tint = note.color ?? (cats[0]?.color || null);

  return (
    <div
      className={clsx(
        "imnode imnode--note",
        tint && "imnode--tinted",
        selected && "imnode--selected",
      )}
      style={tint ? ({ "--node-tint": tint } as React.CSSProperties) : undefined}
      onDoubleClick={(e) => {
        e.stopPropagation();
        useNoteModal.getState().open(note.id, "read");
      }}
    >
      <NodeResizer isVisible={selected} minWidth={140} minHeight={80} />
      <Handles />
      <div className="imnode__title">
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {note.title || "Untitled note"}
        </span>
        {refcount > 1 && <Link2 size={12} color="var(--text-muted)" style={{ flex: "none" }} />}
      </div>
      <div className="imnode__preview">{extractPreview(note.doc)}</div>
      {cats.length > 0 && (
        <div className="imnode__cats">
          {cats.map((c) => (
            <CategoryDot key={c.id} color={c.color} title={c.name} />
          ))}
        </div>
      )}
    </div>
  );
}

export type ImageNodeType = Node<{ boardId: string; assetPath: string }, "image">;

export function ImageNode({ data, selected }: NodeProps<ImageNodeType>) {
  const projectPath = useProject((s) => s.projectPath);
  return (
    <div className={clsx("imnode imnode--image", selected && "imnode--selected")}>
      <NodeResizer isVisible={selected} minWidth={60} minHeight={60} keepAspectRatio />
      <Handles />
      {projectPath && <img src={assetUrl(projectPath, data.assetPath)} alt="" draggable={false} />}
    </div>
  );
}

export type TextNodeType = Node<
  { boardId: string; itemId: string; text: string; fontSize: number },
  "text"
>;

export function TextNode({ data, selected }: NodeProps<TextNodeType>) {
  const [editing, setEditing] = useState(false);
  return (
    <div
      className={clsx("imnode imnode--text", selected && "imnode--selected")}
      style={{ fontSize: data.fontSize }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
    >
      <NodeResizer isVisible={selected} minWidth={60} minHeight={32} />
      <Handles />
      {editing ? (
        <textarea
          autoFocus
          defaultValue={data.text}
          className="nodrag"
          onFocus={(e) => e.target.select()}
          onBlur={(e) => {
            infomap.setText(data.boardId, data.itemId, e.target.value);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) (e.target as HTMLTextAreaElement).blur();
            e.stopPropagation();
          }}
        />
      ) : (
        <span>{data.text}</span>
      )}
    </div>
  );
}

// Type name "frame" avoids React Flow's built-in "group" node styling.
export type GroupNodeType = Node<{ boardId: string; itemId: string; title: string }, "frame">;

export function GroupNode({ data, selected }: NodeProps<GroupNodeType>) {
  const [editing, setEditing] = useState(false);
  return (
    <div className={clsx("imnode imnode--group", selected && "imnode--selected")}>
      <NodeResizer isVisible={selected} minWidth={160} minHeight={120} />
      <Handles />
      {editing ? (
        <input
          className="imnode__grouptitle nodrag"
          autoFocus
          defaultValue={data.title}
          onFocus={(e) => e.target.select()}
          onBlur={(e) => {
            infomap.setGroupTitle(data.boardId, data.itemId, e.target.value.trim() || "Group");
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            e.stopPropagation();
          }}
        />
      ) : (
        <div
          className="imnode__grouptitle"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
        >
          {data.title}
        </div>
      )}
    </div>
  );
}
