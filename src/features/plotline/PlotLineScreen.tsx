import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  List,
  Maximize2,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import clsx from "clsx";
import { useProject } from "../../stores/projectStore";
import { useNotes } from "../../stores/notesStore";
import { useNoteModal } from "../note-editor/noteModalStore";
import { undoStackFor } from "../../lib/undoStack";
import type { PlotLineBoard, PlotPoint, TreeBoard } from "../../lib/schema";
import { plotline } from "./plotActions";
import { usePlotViewport } from "./usePlotViewport";
import { Dock } from "../../components/shell/Dock";
import { IconButton } from "../../components/ui/Button";
import { Menu, MenuItem, MenuSeparator, type MenuPosition } from "../../components/ui/Menu";
import { ConfirmDialog } from "../../components/ui/Modal";
import { extractPreview } from "../notes-board/preview";
import { SectionManagerModal } from "./SectionManager";
import "./plotline.css";

const PAD_TOP = 90;
const PAD_BOTTOM = 130;

export function PlotLineScreen({ treeItem }: { treeItem: TreeBoard }) {
  const board = useProject((s) => s.boards[treeItem.id]) as PlotLineBoard | undefined;
  const notes = useNotes((s) => s.notes);
  const categories = useProject((s) => s.meta?.categories ?? []);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { vp, setVp, setWidth, toScreenX, toWorldX, zoomAt, panBy, fitToView } =
    usePlotViewport(board?.view ?? { zoom: 1, panX: 0 });
  setWidth(size.w);

  // Pan limits depend on the canvas width — re-clamp whenever it changes.
  useEffect(() => {
    setVp((v) => v);
  }, [size.w, setVp]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panning, setPanning] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [dotMenu, setDotMenu] = useState<{ pos: MenuPosition; pointId: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Track canvas size.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setSize({ w: el.clientWidth, h: el.clientHeight }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Persist the viewport, debounced.
  useEffect(() => {
    if (!board) return;
    const t = setTimeout(() => plotline.saveView(board.id, vp), 600);
    return () => clearTimeout(t);
  }, [vp, board?.id]);

  const yTop = PAD_TOP;
  const yBottom = Math.max(size.h - PAD_BOTTOM, yTop + 100);
  const toScreenY = useCallback(
    (y: number) => yTop + (1 - y) * (yBottom - yTop),
    [yTop, yBottom],
  );
  const toWorldY = useCallback(
    (sy: number) => 1 - (sy - yTop) / (yBottom - yTop),
    [yTop, yBottom],
  );

  // Keyboard: delete selected, undo/redo — unless typing somewhere.
  useEffect(() => {
    if (!board) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable))
        return;
      if (useNoteModal.getState().noteId) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        setConfirmDeleteId(selectedId);
      } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undoStackFor(board.id).undo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undoStackFor(board.id).redo();
      } else if (e.key === "Escape") {
        setSelectedId(null);
        setListOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [board?.id, selectedId]);

  const dragState = useRef<{
    kind: "pan" | "dot" | "boundary";
    pointId?: string;
    sectionId?: string;
    edge?: "start" | "end";
    startWorld?: { x: number; y: number };
    lastClientX: number;
  } | null>(null);

  if (!board) return null;

  const sortedSections = [...board.sections].sort((a, b) => a.start - b.start);

  const dotColor = (p: PlotPoint): string => {
    const note = notes[p.noteId];
    const catId = note?.categoryIds[0];
    return (
      (note?.color ??
        (catId ? categories.find((c) => c.id === catId)?.color : null)) ??
      "var(--text)"
    );
  };

  const onCanvasPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const target = e.target as SVGElement;
    if (target.closest("[data-dot]") || target.closest("[data-boundary]")) return;
    dragState.current = { kind: "pan", lastClientX: e.clientX };
    setPanning(true);
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    setSelectedId(null);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const st = dragState.current;
    if (!st) return;
    const rect = wrapRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    if (st.kind === "pan") {
      panBy(st.lastClientX - e.clientX);
      st.lastClientX = e.clientX;
    } else if (st.kind === "dot" && st.pointId) {
      plotline.movePoint(board.id, st.pointId, toWorldX(sx), toWorldY(sy));
    } else if (st.kind === "boundary" && st.sectionId && st.edge) {
      const x = Math.min(1, Math.max(0, toWorldX(sx)));
      plotline.updateSection(board.id, st.sectionId, { [st.edge]: x });
    }
  };

  const onPointerUp = () => {
    const st = dragState.current;
    if (st?.kind === "dot" && st.pointId && st.startWorld) {
      const p = board.points.find((pp) => pp.id === st.pointId);
      if (p) plotline.recordMove(board.id, st.pointId, st.startWorld, { x: p.x, y: p.y });
    }
    dragState.current = null;
    setPanning(false);
  };

  const startDotDrag = (e: React.PointerEvent, p: PlotPoint) => {
    e.stopPropagation();
    dragState.current = {
      kind: "dot",
      pointId: p.id,
      startWorld: { x: p.x, y: p.y },
      lastClientX: e.clientX,
    };
    const svg = wrapRef.current?.querySelector("svg");
    svg?.setPointerCapture(e.pointerId);
    setSelectedId(p.id);
  };

  const addPointAt = (worldX: number, worldY: number) => {
    const { noteId } = plotline.addPoint(
      board.id,
      Math.min(1, Math.max(0, worldX)),
      Math.min(1, Math.max(0, worldY)),
    );
    useNoteModal.getState().open(noteId, "edit");
  };

  const addPointCenter = () => {
    addPointAt(toWorldX(size.w / 2), 0.5);
  };

  const gridYs = [1, 0.5, 0] as const;
  const gridLabels = { 1: "High", 0.5: "Medium", 0: "Low" } as const;

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <div className="pl" ref={wrapRef}>
        <svg
          className={clsx("pl__canvas", panning && "pl__canvas--panning")}
          width={size.w}
          height={size.h}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onDoubleClick={(e) => {
            const rect = wrapRef.current!.getBoundingClientRect();
            addPointAt(toWorldX(e.clientX - rect.left), toWorldY(e.clientY - rect.top));
          }}
          onWheel={(e) => {
            const rect = wrapRef.current!.getBoundingClientRect();
            zoomAt(e.clientX - rect.left, e.deltaY < 0 ? 1.12 : 1 / 1.12);
          }}
        >
          {/* Sections */}
          {sortedSections.map((sec, i) => {
            const x1 = toScreenX(sec.start);
            const x2 = toScreenX(sec.end);
            return (
              <g key={sec.id}>
                <rect
                  className={clsx("pl__section", i % 2 === 1 && "pl__section--alt")}
                  x={x1}
                  y={yTop - 40}
                  width={Math.max(0, x2 - x1)}
                  height={yBottom - yTop + 60}
                />
                <text className="pl__section-title" x={(x1 + x2) / 2} y={yTop - 20} textAnchor="middle">
                  {sec.name}
                </text>
                {(["start", "end"] as const).map((edge) => {
                  const x = edge === "start" ? x1 : x2;
                  return (
                    <g key={edge}>
                      <line className="pl__section-boundary" x1={x} y1={yTop - 40} x2={x} y2={yBottom + 20} />
                      <rect
                        data-boundary
                        className="pl__section-handle"
                        x={x - 5}
                        y={yTop - 40}
                        width={10}
                        height={yBottom - yTop + 60}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          dragState.current = {
                            kind: "boundary",
                            sectionId: sec.id,
                            edge,
                            lastClientX: e.clientX,
                          };
                          (e.currentTarget.ownerSVGElement as SVGSVGElement).setPointerCapture(
                            e.pointerId,
                          );
                        }}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Intensity grid */}
          {gridYs.map((gy) => (
            <g key={gy}>
              <line
                className="pl__gridline"
                x1={0}
                y1={toScreenY(gy)}
                x2={size.w}
                y2={toScreenY(gy)}
              />
              <text className="pl__gridlabel" x={16} y={toScreenY(gy) - 6}>
                {gridLabels[gy]}
              </text>
            </g>
          ))}

          {/* Story axis — labels track the actual story ends */}
          <line className="pl__axis" x1={0} y1={yBottom + 40} x2={size.w} y2={yBottom + 40} />
          <text className="pl__axislabel" x={Math.max(16, toScreenX(0))} y={yBottom + 58}>
            Beginning
          </text>
          <text
            className="pl__axislabel"
            x={Math.min(size.w - 16, toScreenX(1))}
            y={yBottom + 58}
            textAnchor="end"
          >
            Ending
          </text>

          {/* Dots */}
          {board.points.map((p) => {
            const cx = toScreenX(p.x);
            const cy = toScreenY(p.y);
            if (cx < -40 || cx > size.w + 40) return null;
            return (
              <g
                key={p.id}
                data-dot
                className={clsx("pl-dot", selectedId === p.id && "pl-dot--selected")}
                onPointerDown={(e) => startDotDrag(e, p)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(p.id);
                  plotline.setExpanded(board.id, p.id, !p.expanded);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedId(p.id);
                  setDotMenu({ pos: { x: e.clientX, y: e.clientY }, pointId: p.id });
                }}
              >
                <circle className="pl-dot__halo" cx={cx} cy={cy} r={16} />
                <circle
                  className="pl-dot__circle"
                  cx={cx}
                  cy={cy}
                  r={selectedId === p.id ? 8 : 6.5}
                  fill={dotColor(p)}
                />
              </g>
            );
          })}
        </svg>

        {/* Expanded note cards (HTML overlay, visually anchored to dots) */}
        {board.points
          .filter((p) => p.expanded)
          .map((p) => {
            const cx = toScreenX(p.x);
            const cy = toScreenY(p.y);
            if (cx < -260 || cx > size.w + 40) return null;
            const note = notes[p.noteId];
            if (!note) return null;
            const cardTop = Math.max(8, cy - 108);
            return (
              <div key={p.id}>
                <div
                  className="pl-card__stem"
                  style={{ left: cx, top: cardTop + 60, height: Math.max(0, cy - cardTop - 72) }}
                />
                <div
                  className="pl-card"
                  style={{ left: cx - 110, top: cardTop - 8 }}
                  onClick={() => useNoteModal.getState().open(note.id, "read")}
                >
                  <div className="pl-card__title">
                    <span
                      className="catdot"
                      style={{ "--chip-color": dotColor(p) } as React.CSSProperties}
                    />
                    {note.title || "Untitled note"}
                  </div>
                  <div className="pl-card__preview">{extractPreview(note.doc)}</div>
                </div>
              </div>
            );
          })}

        <div className="pl__title">{treeItem.name}</div>

        {/* Point list panel */}
        {listOpen && (
          <div className="pl__listpanel">
            <div className="eyebrow" style={{ padding: "var(--sp-2) var(--sp-4) var(--sp-3)" }}>
              Plot points · {board.points.length}
            </div>
            {[...board.points]
              .sort((a, b) => a.x - b.x)
              .map((p) => {
                const note = notes[p.noteId];
                return (
                  <button
                    key={p.id}
                    className="pl__listrow"
                    onClick={() => useNoteModal.getState().open(p.noteId, "read")}
                  >
                    <span
                      className="catdot"
                      style={{ "--chip-color": dotColor(p) } as React.CSSProperties}
                    />
                    {note?.title || "Untitled note"}
                    <span className="pl__listrow-pos">{Math.round(p.x * 100)}%</span>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      <Dock
        actions={
          <>
            <IconButton onInk label="Add plot point" onClick={addPointCenter}>
              <Plus size={15} />
            </IconButton>
            <IconButton
              onInk
              label="Expand all"
              onClick={() => plotline.setAllExpanded(board.id, true)}
            >
              <ChevronsUpDown size={15} />
            </IconButton>
            <IconButton
              onInk
              label="Collapse all"
              onClick={() => plotline.setAllExpanded(board.id, false)}
            >
              <ChevronsDownUp size={15} />
            </IconButton>
            <IconButton onInk label="Point list" onClick={() => setListOpen((v) => !v)}>
              <List size={15} />
            </IconButton>
            <IconButton onInk label="Manage sections" onClick={() => setSectionsOpen(true)}>
              <SlidersHorizontal size={15} />
            </IconButton>
            <div className="dock__sep" />
            <IconButton onInk label="Zoom out" onClick={() => zoomAt(size.w / 2, 1 / 1.25)}>
              <ZoomOut size={15} />
            </IconButton>
            <span className="meta" style={{ color: "var(--ink-text-muted)", minWidth: 38, textAlign: "center" }}>
              {Math.round(vp.zoom * 100)}%
            </span>
            <IconButton onInk label="Zoom in" onClick={() => zoomAt(size.w / 2, 1.25)}>
              <ZoomIn size={15} />
            </IconButton>
            <IconButton
              onInk
              label="Fit to view"
              onClick={() => fitToView(board.points.map((p) => p.x))}
            >
              <Maximize2 size={15} />
            </IconButton>
          </>
        }
      />

      {sectionsOpen && (
        <SectionManagerModal board={board} onClose={() => setSectionsOpen(false)} />
      )}

      {dotMenu && (
        <Menu position={dotMenu.pos} onClose={() => setDotMenu(null)}>
          <MenuItem
            onSelect={() => {
              const p = board.points.find((pp) => pp.id === dotMenu.pointId);
              if (p) useNoteModal.getState().open(p.noteId, "read");
            }}
          >
            Open
          </MenuItem>
          <MenuItem
            icon={<Pencil size={14} />}
            onSelect={() => {
              const p = board.points.find((pp) => pp.id === dotMenu.pointId);
              if (p) useNoteModal.getState().open(p.noteId, "edit");
            }}
          >
            Edit
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            icon={<Trash2 size={14} />}
            danger
            onSelect={() => setConfirmDeleteId(dotMenu.pointId)}
          >
            Delete
          </MenuItem>
        </Menu>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          title="Delete plot point?"
          message={(() => {
            const p = board.points.find((pp) => pp.id === confirmDeleteId);
            const title = (p && notes[p.noteId]?.title) || "Untitled note";
            return `"${title}" will be removed from the timeline and moved to this project's Trash. You can restore it later, or undo with Ctrl+Z.`;
          })()}
          confirmLabel="Delete"
          destructive
          onConfirm={() => {
            plotline.deletePoint(board.id, confirmDeleteId);
            if (selectedId === confirmDeleteId) setSelectedId(null);
            setConfirmDeleteId(null);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
