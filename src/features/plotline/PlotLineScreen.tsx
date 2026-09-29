import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useProject } from "../../stores/projectStore";
import { useNotes } from "../../stores/notesStore";
import { useNoteModal } from "../note-editor/noteModalStore";
import { undoStackFor } from "../../lib/undoStack";
import { isOverlayOpen, isTypingTarget } from "../../app/shortcuts";
import type { PlotLineBoard, PlotPoint, TreeBoard } from "../../lib/schema";
import { plotline } from "./plotActions";
import { usePlotViewport } from "./usePlotViewport";
import { AppShell, PrimaryAction } from "../../components/shell/TopBar";
import { Button } from "../../components/ui/Button";
import { Menu, MenuItem, MenuSeparator, type MenuPosition } from "../../components/ui/Menu";
import { ConfirmDialog } from "../../components/ui/Modal";
import { extractPreview } from "../notes-board/preview";
import { SectionManagerModal } from "./SectionManager";
import "./plotline.css";

/* Intensity 1 sits PLOT_TOP below the canvas top; intensity 0 sits PLOT_GAP
   above the story baseline, which is BASELINE px above the canvas bottom. */
const PLOT_TOP = 120;
const BASELINE = 64;
const PLOT_GAP = 60;
const CARD_W = 240;
const CARD_H = 150;

export function PlotLineScreen({ treeItem }: { treeItem: TreeBoard }) {
  const board = useProject((s) => s.boards[treeItem.id]) as PlotLineBoard | undefined;
  const notes = useNotes((s) => s.notes);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { vp, setVp, setWidth, toScreenX, toWorldX, zoomAt, panBy } = usePlotViewport(
    board?.view ?? { zoom: 1, panX: 0 },
  );
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
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Persist the viewport, debounced.
  useEffect(() => {
    if (!board) return;
    const t = setTimeout(() => plotline.saveView(board.id, vp), 600);
    return () => clearTimeout(t);
  }, [vp, board?.id]);

  const baselineY = size.h - BASELINE;
  const yTop = PLOT_TOP;
  const yBottom = Math.max(baselineY - PLOT_GAP, yTop + 100);
  const toScreenY = useCallback(
    (y: number) => yTop + (1 - y) * (yBottom - yTop),
    [yTop, yBottom],
  );
  const toWorldY = useCallback(
    (sy: number) => 1 - (sy - yTop) / (yBottom - yTop),
    [yTop, yBottom],
  );

  const openNote = (pointId: string, mode: "read" | "edit" = "read") => {
    const p = board?.points.find((pp) => pp.id === pointId);
    if (p) useNoteModal.getState().open(p.noteId, mode);
  };

  // Keyboard: open, delete, undo/redo — unless typing or a dialog is open.
  useEffect(() => {
    if (!board) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(document.activeElement) || isOverlayOpen()) return;
      if (e.key === "Enter" && selectedId) {
        e.preventDefault();
        openNote(selectedId);
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
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
  const storyOrder = [...board.points].sort((a, b) => a.x - b.x);

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
    const { pointId, noteId } = plotline.addPoint(
      board.id,
      Math.min(1, Math.max(0, worldX)),
      Math.min(1, Math.max(0, worldY)),
    );
    setSelectedId(pointId);
    useNoteModal.getState().open(noteId, "edit");
  };

  const addPointCenter = () => addPointAt(toWorldX(size.w / 2), 0.5);

  const bandBottom = Math.max(0, baselineY);
  const storyLeft = Math.max(0, toScreenX(0));
  const storyRight = Math.min(size.w, toScreenX(1));
  const curve = storyOrder.map((p) => `${toScreenX(p.x)},${toScreenY(p.y)}`).join(" ");

  return (
    <AppShell
      canvas
      actions={
        <>
          <Button variant="ghost" onClick={() => setSectionsOpen(true)}>
            Sections
          </Button>
          <Button variant="ghost" on={listOpen} onClick={() => setListOpen((v) => !v)}>
            List
          </Button>
          <PrimaryAction label="Add moment" onClick={addPointCenter} />
        </>
      }
    >
      <div className="pl" ref={wrapRef}>
        <svg
          className={clsx("pl__canvas", panning && "pl__canvas--panning")}
          width={size.w}
          height={size.h}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onDoubleClick={(e) => {
            if ((e.target as SVGElement).closest("[data-dot]")) return;
            const rect = wrapRef.current!.getBoundingClientRect();
            addPointAt(toWorldX(e.clientX - rect.left), toWorldY(e.clientY - rect.top));
          }}
          onWheel={(e) => {
            const rect = wrapRef.current!.getBoundingClientRect();
            zoomAt(e.clientX - rect.left, e.deltaY < 0 ? 1.12 : 1 / 1.12);
          }}
        >
          {/* Sections: full-height bands, dashed boundaries */}
          {sortedSections.map((sec, i) => {
            const x1 = toScreenX(sec.start);
            const x2 = toScreenX(sec.end);
            return (
              <g key={sec.id}>
                <rect
                  className={i % 2 === 0 ? "pl__band" : "pl__band pl__band--plain"}
                  x={x1}
                  y={0}
                  width={Math.max(0, x2 - x1)}
                  height={bandBottom}
                />
                <text className="pl__section-title" x={x1 + 16} y={104}>
                  {sec.name}
                </text>
              </g>
            );
          })}
          {sortedSections.map((sec) =>
            (["start", "end"] as const).map((edge) => {
              const v = sec[edge];
              const x = toScreenX(v);
              return (
                <g key={`${sec.id}-${edge}`}>
                  {v > 0.001 && v < 0.999 && (
                    <line className="pl__boundary" x1={x} y1={0} x2={x} y2={bandBottom} />
                  )}
                  <rect
                    data-boundary
                    className="pl__boundary-handle"
                    x={x - 5}
                    y={0}
                    width={10}
                    height={bandBottom}
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
            }),
          )}

          {/* Axes */}
          <line className="pl__axis" x1={storyLeft} y1={baselineY} x2={storyRight} y2={baselineY} />
          <text className="pl__axislabel" x={Math.max(16, toScreenX(0))} y={baselineY + 28}>
            BEGINNING
          </text>
          <text
            className="pl__axislabel"
            x={Math.min(size.w - 16, toScreenX(1))}
            y={baselineY + 28}
            textAnchor="end"
          >
            END →
          </text>
          <text className="pl__axislabel" x={32} y={yTop + 31}>
            HIGH
          </text>
          <text className="pl__axislabel" x={32} y={baselineY - 3}>
            LOW
          </text>

          {/* The curve, in story order */}
          {storyOrder.length > 1 && <polyline className="pl__curve" points={curve} />}

          {/* Moments */}
          {board.points.map((p) => {
            const cx = toScreenX(p.x);
            const cy = toScreenY(p.y);
            if (cx < -40 || cx > size.w + 40) return null;
            const selected = selectedId === p.id;
            return (
              <g
                key={p.id}
                data-dot
                className={clsx("pl-dot", selected && "pl-dot--selected")}
                onPointerDown={(e) => startDotDrag(e, p)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(p.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  openNote(p.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedId(p.id);
                  setDotMenu({ pos: { x: e.clientX, y: e.clientY }, pointId: p.id });
                }}
              >
                <title>{notes[p.noteId]?.title || "Untitled note"}</title>
                <circle className="pl-dot__halo" cx={cx} cy={cy} r={12} />
                {selected && <circle className="pl-dot__outer" cx={cx} cy={cy} r={9} />}
                <circle className="pl-dot__ring" cx={cx} cy={cy} r={8} />
                <circle className="pl-dot__fill" cx={cx} cy={cy} r={6} />
              </g>
            );
          })}
        </svg>

        <div className="boardtitle">
          <h1 className="boardtitle__name">{treeItem.name}</h1>
          <span className="boardtitle__meta">
            {board.points.length} {board.points.length === 1 ? "moment" : "moments"} ·{" "}
            {board.sections.length} {board.sections.length === 1 ? "section" : "sections"}
          </span>
        </div>

        {board.points.length === 0 && (
          <div className="pl__hint">Double-click anywhere to add a moment, or press N.</div>
        )}

        {(() => {
          const p = board.points.find((pp) => pp.id === selectedId);
          const note = p && notes[p.noteId];
          if (!p || !note) return null;
          const cx = toScreenX(p.x);
          const cy = toScreenY(p.y);
          if (cx < 0 || cx > size.w) return null;
          const flipX = cx + 18 + CARD_W > size.w - 12;
          const flipY = cy + 14 + CARD_H > size.h - 8;
          const section = sortedSections.find((s) => p.x >= s.start && p.x <= s.end);
          return (
            <div
              className="pl-cardpos"
              style={{
                left: flipX ? cx - 18 : cx + 18,
                top: flipY ? cy - 14 : cy + 14,
                transform: `translate(${flipX ? "-100%" : "0"}, ${flipY ? "-100%" : "0"})`,
              }}
            >
              <button key={p.id} className="pl-card" onClick={() => openNote(p.id)}>
                <span className="pl-card__top">
                  <span>{section?.name.toUpperCase() ?? ""}</span>
                  <span>
                    {storyOrder.indexOf(p) + 1} / {storyOrder.length}
                  </span>
                </span>
                <span className="pl-card__title">{note.title || "Untitled note"}</span>
                {extractPreview(note.doc) && (
                  <span className="pl-card__preview">{extractPreview(note.doc)}</span>
                )}
                <span className="pl-card__open">Open note ↵</span>
              </button>
            </div>
          );
        })()}

        {listOpen && (
          <div className="pl__listpanel">
            <div className="pl__listhead">
              {board.points.length} {board.points.length === 1 ? "moment" : "moments"}
            </div>
            {storyOrder.map((p) => (
              <button
                key={p.id}
                className={clsx("pl__listrow", selectedId === p.id && "pl__listrow--on")}
                onClick={() => {
                  setSelectedId(p.id);
                  openNote(p.id);
                }}
              >
                <span className="pl__listrow-title">{notes[p.noteId]?.title || "Untitled note"}</span>
                <span className="pl__listrow-pos">{Math.round(p.x * 100)}%</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {sectionsOpen && (
        <SectionManagerModal board={board} onClose={() => setSectionsOpen(false)} />
      )}

      {dotMenu && (
        <Menu position={dotMenu.pos} onClose={() => setDotMenu(null)}>
          <MenuItem onSelect={() => openNote(dotMenu.pointId)}>Open</MenuItem>
          <MenuItem icon={<Pencil size={14} />} onSelect={() => openNote(dotMenu.pointId, "edit")}>
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
          title="Delete moment?"
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
    </AppShell>
  );
}
