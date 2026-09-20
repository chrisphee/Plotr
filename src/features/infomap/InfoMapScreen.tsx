import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MarkerType,
  useReactFlow,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowRight,
  Image as ImageIcon,
  Maximize2,
  Minus,
  Network,
  StickyNote,
  Group as GroupIcon,
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import clsx from "clsx";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useProject } from "../../stores/projectStore";
import { useNoteModal } from "../note-editor/noteModalStore";
import { undoStackFor } from "../../lib/undoStack";
import { importAttachment } from "../../tauri/commands";
import type { InfoMapBoard, TreeBoard } from "../../lib/schema";
import { infomap, ITEM_SIZES } from "./infomapActions";
import { Dock } from "../../components/shell/Dock";
import { IconButton } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { NoteNode, ImageNode, TextNode, GroupNode } from "./nodes";
import { ConnEdge } from "./ConnEdge";
import "./infomap.css";

const nodeTypes = { note: NoteNode, image: ImageNode, text: TextNode, frame: GroupNode };
const edgeTypes = { conn: ConnEdge };

export function InfoMapScreen({ treeItem }: { treeItem: TreeBoard }) {
  return (
    <ReactFlowProvider>
      <InfoMapInner treeItem={treeItem} />
    </ReactFlowProvider>
  );
}

function InfoMapInner({ treeItem }: { treeItem: TreeBoard }) {
  const board = useProject((s) => s.boards[treeItem.id]) as InfoMapBoard | undefined;
  const rf = useReactFlow();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [connectKind, setConnectKind] = useState<"arrow" | "line">("arrow");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dragStart = useRef(new Map<string, { x: number; y: number; parentId: string | null }>());
  const ghostRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const boardId = treeItem.id;

  // Undo/redo + confirmed deletion (React Flow's own delete key is disabled).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable))
        return;
      if (useNoteModal.getState().noteId) return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undoStackFor(boardId).undo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undoStackFor(boardId).redo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        setSel((current) => {
          if (current.size > 0) setConfirmDelete(true);
          return current;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [boardId]);

  const nodes = useMemo<Node[]>(() => {
    if (!board) return [];
    // Parents must precede children: groups (potential parents) first.
    const sorted = [...board.items].sort((a, b) => {
      const ag = a.kind === "group" ? 0 : 1;
      const bg = b.kind === "group" ? 0 : 1;
      return ag - bg || a.z - b.z;
    });
    return sorted.map((i) => {
      const base = {
        id: i.id,
        position: { x: i.x, y: i.y },
        width: i.w,
        height: i.h,
        // Without `measured`, @xyflow/system's parseHandles wipes the node's
        // measured handleBounds on every controlled update, and connections
        // can never start. We know the size, so provide it.
        measured: { width: i.w, height: i.h },
        parentId: i.parentId ?? undefined,
        selected: sel.has(i.id),
        zIndex: i.kind === "group" ? 0 : i.z,
      };
      switch (i.kind) {
        case "note":
          return { ...base, type: "note", data: { boardId, noteId: i.noteId } };
        case "image":
          return { ...base, type: "image", data: { boardId, assetPath: i.assetPath } };
        case "text":
          return {
            ...base,
            type: "text",
            data: { boardId, itemId: i.id, text: i.text, fontSize: i.fontSize },
          };
        case "group":
          return { ...base, type: "frame", data: { boardId, itemId: i.id, title: i.title } };
      }
    });
  }, [board, boardId, sel]);

  const edges = useMemo<Edge[]>(() => {
    if (!board) return [];
    return board.connections.map((c) => ({
      id: c.id,
      source: c.from,
      target: c.to,
      sourceHandle: c.fromHandle ?? undefined,
      targetHandle: c.toHandle ?? undefined,
      type: "conn",
      selected: sel.has(c.id),
      data: { boardId, label: c.label },
      markerEnd:
        c.kind === "arrow"
          ? { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "var(--text-muted)" }
          : undefined,
    }));
  }, [board, boardId, sel]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const removed: string[] = [];
      for (const ch of changes) {
        if (ch.type === "position" && ch.position) {
          infomap.setPosition(boardId, ch.id, ch.position.x, ch.position.y);
        } else if (ch.type === "dimensions" && ch.dimensions && ch.resizing !== false) {
          infomap.setSize(boardId, ch.id, ch.dimensions.width, ch.dimensions.height);
        } else if (ch.type === "select") {
          setSel((s) => {
            const next = new Set(s);
            if (ch.selected) next.add(ch.id);
            else next.delete(ch.id);
            return next;
          });
        } else if (ch.type === "remove") {
          removed.push(ch.id);
        }
      }
      if (removed.length) infomap.deleteItems(boardId, removed);
    },
    [boardId],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removed: string[] = [];
      for (const ch of changes) {
        if (ch.type === "select") {
          setSel((s) => {
            const next = new Set(s);
            if (ch.selected) next.add(ch.id);
            else next.delete(ch.id);
            return next;
          });
        } else if (ch.type === "remove") {
          removed.push(ch.id);
        }
      }
      if (removed.length) infomap.deleteConnections(boardId, removed);
    },
    [boardId],
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      if (conn.source && conn.target && conn.source !== conn.target) {
        infomap.connect(
          boardId,
          conn.source,
          conn.target,
          connectKind,
          conn.sourceHandle,
          conn.targetHandle,
        );
      }
    },
    [boardId, connectKind],
  );

  const onNodeDragStart = useCallback(
    (_e: unknown, node: Node, nodes: Node[]) => {
      dragStart.current.clear();
      for (const n of [node, ...nodes]) {
        const item = board?.items.find((i) => i.id === n.id);
        if (item) {
          dragStart.current.set(n.id, { x: item.x, y: item.y, parentId: item.parentId });
        }
      }
    },
    [board],
  );

  const onNodeDragStop = useCallback(
    (_e: unknown, node: Node, nodes: Node[]) => {
      for (const n of [node, ...nodes]) {
        const start = dragStart.current.get(n.id);
        if (!start) continue;
        const item = board?.items.find((i) => i.id === n.id);
        if (!item) continue;

        let parentId = item.parentId;
        let { x, y } = item;

        // Re-parent non-group items by intersection with group frames.
        if (item.kind !== "group") {
          const internal = rf.getInternalNode(n.id);
          const abs = internal?.internals.positionAbsolute ?? { x: item.x, y: item.y };
          const center = { x: abs.x + item.w / 2, y: abs.y + item.h / 2 };
          const groups = (board?.items ?? []).filter((i) => i.kind === "group");
          const target = groups.find(
            (g) =>
              center.x >= g.x && center.x <= g.x + g.w && center.y >= g.y && center.y <= g.y + g.h,
          );
          const targetId = target?.id ?? null;
          if (targetId !== item.parentId) {
            parentId = targetId;
            x = target ? abs.x - target.x : abs.x;
            y = target ? abs.y - target.y : abs.y;
            infomap.setParent(boardId, n.id, parentId, x, y);
          }
        }
        infomap.recordMove(boardId, n.id, start, { x, y, parentId });
        dragStart.current.delete(n.id);
      }
    },
    [board, boardId, rf],
  );

  const centerWorld = useCallback(() => {
    return rf.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
  }, [rf]);

  const addImage = useCallback(
    async (at?: { x: number; y: number }) => {
      const projectPath = useProject.getState().projectPath;
      if (!projectPath) return;
      const picked = await openDialog({
        title: "Add image",
        filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"] }],
      });
      if (typeof picked !== "string") return;
      const meta = await importAttachment(projectPath, picked);
      const c = at ?? centerWorld();
      infomap.addImage(boardId, meta.rel_path, c.x - 120, c.y - 90);
    },
    [boardId, centerWorld],
  );

  /** Create an item of `kind` at a world position (from click or drop). */
  const createAt = useCallback(
    (kind: string, at: { x: number; y: number }) => {
      switch (kind) {
        case "note": {
          const { noteId } = infomap.addNote(boardId, at.x - 130, at.y - 80);
          useNoteModal.getState().open(noteId, "edit");
          break;
        }
        case "image":
          void addImage(at);
          break;
        case "text":
          infomap.addText(boardId, at.x - 80, at.y - 22);
          break;
        case "group":
          infomap.addGroup(boardId, at.x - 210, at.y - 150);
          break;
      }
    },
    [boardId, addImage],
  );

  const onCanvasDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/plotr-item")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const onCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      const kind = e.dataTransfer.getData("application/plotr-item");
      if (!kind) return;
      e.preventDefault();
      createAt(kind, rf.screenToFlowPosition({ x: e.clientX, y: e.clientY }));
    },
    [createAt, rf],
  );

  if (!board) return null;

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <div
        className="im"
        style={{ position: "absolute", inset: 0 }}
        onDragOver={onCanvasDragOver}
        onDrop={onCanvasDrop}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          connectionMode={"loose" as never}
          deleteKeyCode={null}
          defaultViewport={board.view}
          onMoveEnd={(_e, viewport) => infomap.saveView(boardId, viewport)}
          minZoom={0.15}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="var(--hairline-strong)" />
        </ReactFlow>

        <div className="im__title">{treeItem.name}</div>

        {/* Add / tool panel — click to place at centre, or drag onto the canvas */}
        <div className="im__panel">
          {(
            [
              ["note", "Note", <StickyNote key="i" size={15} />],
              ["image", "Image", <ImageIcon key="i" size={15} />],
              ["text", "Text", <Type key="i" size={15} />],
              ["group", "Group", <GroupIcon key="i" size={15} />],
            ] as const
          ).map(([kind, label, icon]) => (
            <button
              key={kind}
              className="im__panelbtn"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/plotr-item", kind);
                e.dataTransfer.effectAllowed = "copy";
                const ghost = ghostRefs.current[kind];
                if (ghost) {
                  const s = ITEM_SIZES[kind];
                  e.dataTransfer.setDragImage(ghost, s.w / 2, s.h / 2);
                }
              }}
              onClick={() => createAt(kind, centerWorld())}
              title={`Click to add, or drag onto the canvas`}
            >
              {icon} {label}
            </button>
          ))}

          {/* Off-screen replicas of each item type, used as drag previews. */}
          <div className="im__ghosts" aria-hidden>
            <div
              ref={(el) => {
                ghostRefs.current.note = el;
              }}
              className="imnode imnode--note im__ghost"
              style={{ width: ITEM_SIZES.note.w, height: ITEM_SIZES.note.h }}
            >
              <div className="imnode__title">New note</div>
              <div className="im__ghostline" style={{ width: "80%" }} />
              <div className="im__ghostline" style={{ width: "60%" }} />
            </div>
            <div
              ref={(el) => {
                ghostRefs.current.image = el;
              }}
              className="imnode imnode--image im__ghost im__ghost--image"
              style={{ width: ITEM_SIZES.image.w, height: ITEM_SIZES.image.h }}
            >
              <ImageIcon size={28} strokeWidth={1.5} />
            </div>
            <div
              ref={(el) => {
                ghostRefs.current.text = el;
              }}
              className="imnode imnode--text im__ghost"
              style={{ width: ITEM_SIZES.text.w, height: ITEM_SIZES.text.h, fontSize: 18 }}
            >
              <span>Label</span>
            </div>
            <div
              ref={(el) => {
                ghostRefs.current.group = el;
              }}
              className="imnode imnode--group im__ghost im__ghost--group"
              style={{ width: ITEM_SIZES.group.w, height: ITEM_SIZES.group.h }}
            >
              <span className="imnode__grouptitle" style={{ position: "static" }}>
                Group
              </span>
            </div>
          </div>
          <div className="im__panelsep" />
          <button
            className={clsx("im__panelbtn", connectKind === "line" && "im__panelbtn--active")}
            onClick={() => setConnectKind("line")}
            title="New connections are undirected lines"
          >
            <Minus size={15} /> Line
          </button>
          <button
            className={clsx("im__panelbtn", connectKind === "arrow" && "im__panelbtn--active")}
            onClick={() => setConnectKind("arrow")}
            title="New connections are directional arrows"
          >
            <ArrowRight size={15} /> Arrow
          </button>
        </div>

        {board.items.length === 0 && (
          <div className="im__empty">
            <EmptyState
              icon={<Network size={28} strokeWidth={1.5} />}
              title="An empty canvas"
              message="Add a note, image, text or group from the panel on the left, then drag between items to connect them."
            />
          </div>
        )}
      </div>

      <Dock
        actions={
          <>
            <IconButton onInk label="Zoom out" onClick={() => void rf.zoomOut()}>
              <ZoomOut size={15} />
            </IconButton>
            <IconButton onInk label="Zoom in" onClick={() => void rf.zoomIn()}>
              <ZoomIn size={15} />
            </IconButton>
            <IconButton
              onInk
              label="Fit to view"
              onClick={() => void rf.fitView({ padding: 0.2, duration: 300 })}
            >
              <Maximize2 size={15} />
            </IconButton>
          </>
        }
      />

      {confirmDelete && (
        <ConfirmDialog
          title="Delete from canvas?"
          message={(() => {
            const itemCount = board.items.filter((i) => sel.has(i.id)).length;
            const connCount = board.connections.filter((c) => sel.has(c.id)).length;
            const parts = [];
            if (itemCount)
              parts.push(`${itemCount} ${itemCount === 1 ? "item" : "items"}`);
            if (connCount)
              parts.push(`${connCount} ${connCount === 1 ? "connection" : "connections"}`);
            return `${parts.join(" and ")} will be removed. Notes go to this project's Trash; you can also undo with Ctrl+Z.`;
          })()}
          confirmLabel="Delete"
          destructive
          onConfirm={() => {
            const itemIds = board.items.filter((i) => sel.has(i.id)).map((i) => i.id);
            const connIds = board.connections.filter((c) => sel.has(c.id)).map((c) => c.id);
            if (itemIds.length) infomap.deleteItems(boardId, itemIds);
            if (connIds.length) infomap.deleteConnections(boardId, connIds);
            setSel(new Set());
            setConfirmDelete(false);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
