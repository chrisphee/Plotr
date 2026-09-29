import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Columns3, ListOrdered, Maximize2, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useProject } from "../../stores/projectStore";
import { useNotes } from "../../stores/notesStore";
import { useNoteModal } from "../note-editor/noteModalStore";
import { undoStackFor } from "../../lib/undoStack";
import { isOverlayOpen, isTypingTarget } from "../../app/shortcuts";
import type { PlotLineBoard, PlotPoint, TreeBoard } from "../../lib/schema";
import { plotline } from "./plotActions";
import { PAD_X, usePlotViewport } from "./usePlotViewport";
import { AppShell, PrimaryAction } from "../../components/shell/TopBar";
import { Button } from "../../components/ui/Button";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Menu, MenuItem, MenuSeparator, type MenuPosition } from "../../components/ui/Menu";
import { ConfirmDialog } from "../../components/ui/Modal";
import { extractPreview } from "../notes-board/preview";
import { monotonePath, sampleMonotone } from "../../lib/spline";
import { SectionManagerModal } from "./SectionManager";
import "./plotline.css";

/* Intensity 1 sits `top` below the canvas top; intensity 0 sits PLOT_GAP
   above the story baseline, which is BASELINE px above the canvas bottom.
   Denser label modes push the top down so labels above peaks stay clear. */
const BASELINE = 84;
const PLOT_GAP = 60;
const CARD_W = 264;
const CARD_H = 164;
const LEAD_X = 34;
const LEAD_Y = 26;
const INTENSITY_STEP = 0.05;
const CHAR_W = 6.9;

type Density = "dots" | "titles" | "cards";
const DENSITY_KEY = "plotr.plotDensity";
const COMPACT_H = 32;
const LABEL = {
  titles: { w: 240, h: 26, top: 104 },
  cards: { w: 188, h: 72, top: 150 },
};
const PILL_TOP = 14;

function readDensity(): Density {
  try {
    const v = localStorage.getItem(DENSITY_KEY);
    return v === "dots" || v === "cards" ? v : "titles";
  } catch {
    return "titles";
  }
}

export function PlotLineScreen({ treeItem }: { treeItem: TreeBoard }) {
  const board = useProject((s) => s.boards[treeItem.id]) as PlotLineBoard | undefined;
  const notes = useNotes((s) => s.notes);

  const wrapRef = useRef<HTMLDivElement>(null);
  const areaId = "plarea" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const labelCache = useRef<{ key: string; value: Placed[] } | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { vp, setVp, setWidth, toScreenX, toWorldX, zoomAt, panBy, fitToView } = usePlotViewport(
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
  const [density, setDensityState] = useState<Density>(readDensity);

  const setDensity = (d: Density) => {
    setDensityState(d);
    try {
      localStorage.setItem(DENSITY_KEY, d);
    } catch {
      /* per-viewer convenience only */
    }
  };

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
  const yTop = density === "dots" ? 84 : LABEL[density].top;
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

  /** Selects a moment and pans just enough to keep it on screen. */
  const selectAndReveal = useCallback(
    (p: PlotPoint) => {
      setSelectedId(p.id);
      const cx = toScreenX(p.x);
      if (cx < PAD_X) panBy(cx - PAD_X);
      else if (cx > size.w - PAD_X - CARD_W) panBy(cx - (size.w - PAD_X - CARD_W));
    },
    [toScreenX, panBy, size.w],
  );

  // Keyboard: step between moments, nudge intensity, open, delete, undo/redo.
  useEffect(() => {
    if (!board) return;
    const boardId = board.id;
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(document.activeElement) || isOverlayOpen()) return;
      const fresh = useProject.getState().boards[boardId] as PlotLineBoard | undefined;
      if (!fresh) return;
      const order = [...fresh.points].sort((a, b) => a.x - b.x);
      const idx = order.findIndex((p) => p.id === selectedId);
      const sel = idx >= 0 ? order[idx] : null;

      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        if (order.length === 0) return;
        e.preventDefault();
        const step = e.key === "ArrowRight" ? 1 : -1;
        const next =
          idx < 0 ? order[step > 0 ? 0 : order.length - 1] : order[Math.min(order.length - 1, Math.max(0, idx + step))];
        selectAndReveal(next);
      } else if ((e.key === "Home" || e.key === "End") && order.length > 0) {
        e.preventDefault();
        selectAndReveal(order[e.key === "Home" ? 0 : order.length - 1]);
      } else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && sel) {
        e.preventDefault();
        const delta = (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? INTENSITY_STEP / 5 : INTENSITY_STEP);
        const y = Math.min(1, Math.max(0, sel.y + delta));
        plotline.movePoint(boardId, sel.id, sel.x, y);
        plotline.recordMove(boardId, sel.id, { x: sel.x, y: sel.y }, { x: sel.x, y });
      } else if (e.key === "Enter" && sel) {
        e.preventDefault();
        useNoteModal.getState().open(sel.noteId, "read");
      } else if ((e.key === "Delete" || e.key === "Backspace") && sel) {
        setConfirmDeleteId(sel.id);
      } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undoStackFor(boardId).undo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undoStackFor(boardId).redo();
      } else if (e.key === "Escape") {
        setSelectedId(null);
        setListOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [board?.id, selectedId, selectAndReveal]);

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
  const sectionOf = (p: PlotPoint) => sortedSections.find((s) => p.x >= s.start && p.x <= s.end);

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
  const curvePts = storyOrder.map((p) => ({ x: toScreenX(p.x), y: toScreenY(p.y) }));
  const curvePath = monotonePath(curvePts);
  const curveLine = sampleMonotone(curvePts, 16);
  const areaPath =
    curvePts.length > 1
      ? `${curvePath} L${curvePts[curvePts.length - 1].x},${baselineY} L${curvePts[0].x},${baselineY} Z`
      : "";
  // Text that labels and the query card must never cover.
  const fixedText: Rect[] = [
    { x: 20, y: yTop - 12, w: 52, h: 20 },
    { x: 20, y: yBottom - 12, w: 52, h: 20 },
    { x: 10, y: (yTop + yBottom) / 2 - 36, w: 20, h: 72 },
    ...sortedSections.map((sec) => ({
      x: toScreenX(sec.start) + 10,
      y: PILL_TOP - 4,
      w: sec.name.length * 7.2 + 32,
      h: 36,
    })),
  ];

  const labelKey = [
    density,
    size.w,
    size.h,
    vp.zoom,
    vp.panX,
    ...storyOrder.map((p) => `${p.id}:${p.x}:${p.y}:${notes[p.noteId]?.title ?? ""}`),
    ...sortedSections.map((sec) => `${sec.name}:${sec.start}`),
  ].join("|");
  const labels =
    density === "dots"
      ? []
      : labelCache.current?.key === labelKey
        ? labelCache.current.value
        : placeLabels(
          storyOrder,
          curvePts,
          curveLine,
          { minTop: PILL_TOP + 34, maxBottom: baselineY - 22, width: size.w },
          storyOrder.map((p, i) => {
            if (density === "cards") return { w: LABEL.cards.w, h: LABEL.cards.h };
            const title = notes[p.noteId]?.title || "Untitled note";
            const num = String(i + 1).length;
            const est = 30 + (title.length + num) * CHAR_W;
            const wrapped = est > 160 ? Math.min(LABEL.titles.w, twoLineWidth(title, num)) : undefined;
            return est <= LABEL.titles.w
              ? { w: est, h: LABEL.titles.h, wrapped }
              : { w: LABEL.titles.w, h: 44, wrapped };
          }),
          density === "cards" ? 22 : 11,
          fixedText,
        );
  if (density !== "dots") labelCache.current = { key: labelKey, value: labels };
  const cardAvoid = (id: string): Rect[] =>
    labels.filter((l) => l.id !== id).map((l) => ({ x: l.left, y: l.top, w: l.width, h: l.height }));

  const selected = board.points.find((p) => p.id === selectedId) ?? null;
  const cardPos = selected
    ? cardPosition(toScreenX(selected.x), toScreenY(selected.y), size, curvePts, curveLine, cardAvoid(selected.id), fixedText)
    : null;
  const selectedNote = selected ? notes[selected.noteId] : undefined;
  const selectedIndex = selected ? storyOrder.indexOf(selected) : -1;

  return (
    <AppShell
      canvas
      subtitle={`${board.points.length} ${board.points.length === 1 ? "moment" : "moments"}`}
      actions={
        <>
          <SegmentedControl
            label="Moment detail"
            value={density}
            onChange={setDensity}
            segments={[
              { value: "dots", label: "Dots" },
              { value: "titles", label: "Titles" },
              { value: "cards", label: "Cards" },
            ]}
          />
          <Button variant="ghost" onClick={() => setSectionsOpen(true)} title="Sections">
            <Columns3 size={15} strokeWidth={1.75} />
            <span className="btn__label">Sections</span>
          </Button>
          <Button variant="ghost" on={listOpen} onClick={() => setListOpen((v) => !v)} title="List of moments">
            <ListOrdered size={15} strokeWidth={1.75} />
            <span className="btn__label">List</span>
          </Button>
          <PrimaryAction label="Add moment" onClick={addPointCenter} />
        </>
      }
    >
      <div
        className="pl"
        ref={wrapRef}
        role="region"
        aria-label="Plot line. Arrow keys move between moments, Up and Down change intensity, Enter opens the moment."
      >
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
            const x1 = sec.start <= 0.001 ? 0 : toScreenX(sec.start);
            const x2 = sec.end >= 0.999 ? size.w : toScreenX(sec.end);
            return (
              <g key={sec.id}>
                <rect
                  className={i % 2 === 0 ? "pl__band" : "pl__band pl__band--plain"}
                  x={x1}
                  y={0}
                  width={Math.max(0, x2 - x1)}
                  height={bandBottom}
                />
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
          <text className="pl__axislabel" x={Math.max(16, storyLeft)} y={baselineY + 22}>
            Beginning
          </text>
          <text
            className="pl__axislabel"
            x={Math.min(size.w - 16, storyRight)}
            y={baselineY + 22}
            textAnchor="end"
          >
            End
          </text>
          <text className="pl__axislabel" x={28} y={yTop + 4}>
            High
          </text>
          <text className="pl__axislabel" x={28} y={yBottom + 4}>
            Low
          </text>
          <text
            className="pl__axislabel pl__axislabel--name"
            transform={`translate(22, ${(yTop + yBottom) / 2}) rotate(-90)`}
            textAnchor="middle"
          >
            Intensity
          </text>

          {/* The curve, in story order */}
          <defs>
            <linearGradient id={areaId} x1="0" y1={yTop} x2="0" y2={baselineY} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.16" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {areaPath && <path className="pl__area" d={areaPath} fill={`url(#${areaId})`} />}
          {storyOrder.length > 1 && <path className="pl__curve" d={curvePath} />}

          {/* Label stems (Cards) and the selected moment's leader line */}
          {labels.map((l) =>
            l.stem && l.id !== selectedId ? (
              <line key={`stem-${l.id}`} className="pl__stem" {...l.stem} />
            ) : null,
          )}

          {/* Moments */}
          {board.points.map((p) => {
            const cx = toScreenX(p.x);
            const cy = toScreenY(p.y);
            if (cx < -40 || cx > size.w + 40) return null;
            const isSel = selectedId === p.id;
            return (
              <g
                key={p.id}
                data-dot
                className={clsx("pl-dot", isSel && "pl-dot--selected")}
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
                <circle className="pl-dot__halo" cx={cx} cy={cy} r={14} />
                <circle className="pl-dot__fill" cx={cx} cy={cy} r={isSel ? 7 : 6} />
              </g>
            );
          })}

          {selectedNote && cardPos && (
            <g className="pl__leader">
              <line x1={cardPos.from.x} y1={cardPos.from.y} x2={cardPos.to.x} y2={cardPos.to.y} />
            </g>
          )}
        </svg>

        {/* Titles or cards beside each moment */}
        {labels.length > 0 && (
          <div className="pl__labels">
            {labels.map((l) => {
              if (l.id === selectedId) return null;
              const p = storyOrder[l.index];
              const note = notes[p.noteId];
              return (
                <button
                  key={l.id}
                  className={clsx(
                    "pl-label",
                    l.shape === "number" ? "pl-label--number" : `pl-label--${density}`,
                    l.shape === "title" && "pl-label--compact",
                  )}
                  style={{ left: l.left, top: l.top, width: l.width, height: l.height }}
                  tabIndex={-1}
                  title={l.shape === "number" ? note?.title || "Untitled note" : undefined}
                  onClick={() => setSelectedId(p.id)}
                  onDoubleClick={() => openNote(p.id)}
                >
                  <span className="pl-label__head">
                    <span className="pl-label__num">{l.index + 1}</span>
                    {l.shape !== "number" && (
                      <span className="pl-label__title">{note?.title || "Untitled note"}</span>
                    )}
                  </span>
                  {density === "cards" && l.shape === "full" && note && extractPreview(note.doc) && (
                    <span className="pl-label__preview">{extractPreview(note.doc)}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <h1 className="sr-only">{treeItem.name}</h1>
        <div className="pl__sections" aria-hidden>
          {sortedSections.map((sec) => {
            const x = toScreenX(sec.start);
            if (x > size.w || toScreenX(sec.end) < 0) return null;
            return (
              <span key={sec.id} className="pl-section" style={{ left: Math.max(8, x + 10), top: PILL_TOP }}>
                {sec.name}
              </span>
            );
          })}
        </div>

        {board.points.length === 0 && (
          <div className="pl__hint">
            <span className="pl__hinttitle">Your plot line is empty</span>
            Double-click anywhere to add a moment, or press N.
          </div>
        )}

        {selected && selectedNote && cardPos && (() => {
          const section = sectionOf(selected);
          const preview = extractPreview(selectedNote.doc);
          return (
            <div className="pl-cardpos" style={{ left: cardPos.left, top: cardPos.top }}>
              <button key={selected.id} className="pl-card" onClick={() => openNote(selected.id)}>
                <span className="pl-card__where">
                  {section && <span className="pl-card__section">{section.name}</span>}
                  <span>
                    {selectedIndex + 1} of {storyOrder.length}
                  </span>
                </span>
                <span className="pl-card__title">{selectedNote.title || "Untitled note"}</span>
                {preview && <span className="pl-card__preview">{preview}</span>}
                <span className="pl-card__open">
                  Open note <span className="kbd">Enter</span>
                </span>
              </button>
            </div>
          );
        })()}

        <div className="sr-only" aria-live="polite">
          {selected && selectedNote
            ? `Moment ${selectedIndex + 1} of ${storyOrder.length}: ${selectedNote.title || "Untitled note"}${
                sectionOf(selected) ? `, ${sectionOf(selected)!.name}` : ""
              }, intensity ${Math.round(selected.y * 100)}%`
            : ""}
        </div>

        <div className="zoompill">
          <button className="zoompill__btn" aria-label="Zoom out" onClick={() => zoomAt(size.w / 2, 1 / 1.25)}>
            <Minus size={14} />
          </button>
          <span className="zoompill__val">{Math.round(vp.zoom * 100)}%</span>
          <button className="zoompill__btn" aria-label="Zoom in" onClick={() => zoomAt(size.w / 2, 1.25)}>
            <Plus size={14} />
          </button>
          <span className="zoompill__sep" />
          <button
            className="zoompill__btn"
            onClick={() => fitToView(board.points.map((p) => p.x))}
            aria-label="Fit all moments in view"
            title="Fit all moments in view"
          >
            <Maximize2 size={14} strokeWidth={2} />
          </button>
        </div>

        {listOpen && (
          <div className="pl__listpanel">
            <div className="pl__listhead">
              {board.points.length} {board.points.length === 1 ? "moment" : "moments"}
            </div>
            {storyOrder.map((p, i) => (
              <button
                key={p.id}
                className={clsx("pl__listrow", selectedId === p.id && "pl__listrow--on")}
                onClick={() => {
                  selectAndReveal(p);
                  openNote(p.id);
                }}
              >
                <span className="pl__listrow-num">{i + 1}</span>
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
          <MenuItem icon={<ArrowUpRight size={15} />} onSelect={() => openNote(dotMenu.pointId)}>
            Open
          </MenuItem>
          <MenuItem icon={<Pencil size={15} />} onSelect={() => openNote(dotMenu.pointId, "edit")}>
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

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Width of a title label set on two balanced lines. */
function twoLineWidth(title: string, numChars: number) {
  const words = title.split(/\s+/).filter(Boolean);
  let best = title.length;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length + numChars + 1;
    const b = words.slice(i).join(" ").length;
    best = Math.min(best, Math.max(a, b));
  }
  return Math.ceil(30 + best * CHAR_W);
}

type Pt = { x: number; y: number };

function overlapArea(r: Rect, others: Rect[]) {
  let sum = 0;
  for (const q of others) {
    sum +=
      Math.max(0, Math.min(r.x + r.w, q.x + q.w) - Math.max(r.x, q.x)) *
      Math.max(0, Math.min(r.y + r.h, q.y + q.h) - Math.max(r.y, q.y));
  }
  return sum;
}

function curveHits(r: Rect, pts: Pt[]) {
  let n = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (Math.max(a.x, b.x) < r.x || Math.min(a.x, b.x) > r.x + r.w) continue;
    for (let t = 0; t <= 1; t += 1 / 8) {
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) n++;
    }
  }
  return n;
}

function dotHits(r: Rect, pts: Pt[]) {
  return pts.filter((d) => d.x >= r.x - 9 && d.x <= r.x + r.w + 9 && d.y >= r.y - 9 && d.y <= r.y + r.h + 9)
    .length;
}

/** Where the selected moment's query card sits: the corner with the most free
   space, slid toward the dot when that clears fixed text. */
function cardPosition(
  cx: number,
  cy: number,
  size: { w: number; h: number },
  pts: Pt[],
  line: Pt[],
  avoid: Rect[],
  fixed: Rect[],
) {
  if (cx < 0 || cx > size.w) return null;
  const others = pts.filter((p) => p.x !== cx || p.y !== cy);
  let best: { left: number; top: number; dx: number; dy: number; cost: number } | null = null;
  for (const dx of [1, -1]) {
    for (const dy of [1, -1]) {
      for (const slide of [0, 16, 32]) {
        const left = dx > 0 ? cx + LEAD_X : cx - LEAD_X - CARD_W;
        const top = dy > 0 ? cy + LEAD_Y - slide : cy - LEAD_Y - CARD_H + slide;
        const r = { x: left, y: top, w: CARD_W, h: CARD_H };
        const outside = left < 8 || top < 8 || left + CARD_W > size.w - 8 || top + CARD_H > size.h - 8;
        const cost =
          overlapArea(r, avoid) + overlapArea(r, fixed) * 20 + curveHits(r, line) * 400 +
          dotHits(r, others) * 900 + (outside ? 1e6 : 0) + (dx < 0 ? 5 : 0) + (dy < 0 ? 5 : 0) + slide;
        if (!best || cost < best.cost) best = { left, top, dx, dy, cost };
      }
    }
  }
  const { left, top, dx, dy } = best!;
  const to = { x: dx > 0 ? left : left + CARD_W, y: dy > 0 ? top : top + CARD_H };
  const len = Math.hypot(to.x - cx, to.y - cy) || 1;
  const from = { x: cx + ((to.x - cx) / len) * 11, y: cy + ((to.y - cy) / len) * 11 };
  return { left, top, from, to };
}

interface Placed {
  id: string;
  index: number;
  left: number;
  top: number;
  width: number;
  height: number;
  /** "title": a card cut to its title line; "number": only the moment number fits. */
  shape: "full" | "title" | "number";
  stem: { x1: number; y1: number; x2: number; y2: number } | null;
}

type Spot = { r: Rect; shape: Placed["shape"]; bias: number };

/** Where one label may go: above, below or beside its dot, near or a step away. */
function candidates(
  cx: number,
  cy: number,
  size: { w: number; h: number; wrapped?: number },
  numW: number,
  gap: number,
  cards: boolean,
  width: number,
): Spot[] {
  const shapes: { w: number; h: number; shape: Placed["shape"]; extra: number }[] = [
    { w: size.w, h: size.h, shape: "full", extra: 0 },
  ];
  if (cards) shapes.push({ w: size.w, h: COMPACT_H, shape: "title", extra: 500 });
  else if (size.wrapped) shapes.push({ w: size.wrapped, h: 44, shape: "full", extra: 220 });
  shapes.push({ w: numW, h: 26, shape: "number", extra: 6000 });

  const spots: Spot[] = [];
  for (const sh of shapes) {
    const reach = sh.shape === "number" ? [gap, gap + 16] : [gap, gap + 22, gap + 48, gap + 84, gap + 128];
    reach.forEach((d, k) => {
      for (const above of [true, false]) {
        const y = above ? cy - d - sh.h : cy + d;
        for (const anchor of [0.5, 0.2, 0.8, 0.02, 0.98]) {
          const x = Math.min(Math.max(8, cx - sh.w * anchor), width - sh.w - 8);
          spots.push({
            r: { x, y, w: sh.w, h: sh.h },
            shape: sh.shape,
            bias: sh.extra + k * 60 + Math.abs(anchor - 0.5) * 50 + (above ? 0 : 6),
          });
        }
      }
      for (const dir of [1, -1]) {
        const x = dir > 0 ? cx + d + 2 : cx - d - 2 - sh.w;
        for (const dy of [0, -(sh.h / 2 + 12), sh.h / 2 + 12]) {
          spots.push({
            r: { x, y: cy - sh.h / 2 + dy, w: sh.w, h: sh.h },
            shape: sh.shape,
            bias: sh.extra + k * 60 + 30 + Math.abs(dy) * 0.8 + (dir < 0 ? 10 : 0),
          });
        }
      }
    });
  }
  return spots;
}

/* Label placement. Every label picks the spot that covers the least of the
   other labels, fixed text, the curve and the dots, then a few passes let each
   label move again with all the others in place. A crowded moment falls back to
   a shorter card, then to its number alone. */
function placeLabels(
  order: PlotPoint[],
  pts: Pt[],
  line: Pt[],
  bounds: { minTop: number; maxBottom: number; width: number },
  sizes: { w: number; h: number; wrapped?: number }[],
  gap: number,
  fixed: Rect[],
): Placed[] {
  const cards = gap > 15;
  const n = order.length;
  const spots = order.map((_, i) => {
    const { x: cx } = pts[i];
    if (cx < -sizes[i].w || cx > bounds.width + sizes[i].w) return null;
    return candidates(cx, pts[i].y, sizes[i], 26 + String(i + 1).length * 7, gap, cards, bounds.width);
  });
  const choice = new Array<number>(n).fill(-1);

  const cost = (spot: Spot, others: Rect[]) => {
    const r = spot.r;
    if (r.y < bounds.minTop || r.y + r.h > bounds.maxBottom || r.x < 8 || r.x + r.w > bounds.width - 8) return 1e9;
    const spaced = { x: r.x - 6, y: r.y - 5, w: r.w + 12, h: r.h + 10 };
    return (
      overlapArea(spaced, others) * 60 +
      overlapArea(spaced, fixed) * 60 +
      curveHits(spaced, line) * 400 +
      dotHits(r, pts) * 900 +
      spot.bias
    );
  };
  const pick = (i: number, among: number[]) => {
    const others = among.filter((j) => j !== i && choice[j] >= 0).map((j) => spots[j]![choice[j]].r);
    let best = 0;
    let bestCost = Infinity;
    spots[i]!.forEach((spot, k) => {
      const c = cost(spot, others);
      if (c < bestCost) {
        bestCost = c;
        best = k;
      }
    });
    return best;
  };

  const shown = order.map((_, i) => i).filter((i) => spots[i]);
  shown.forEach((i, k) => (choice[i] = pick(i, shown.slice(0, k))));
  for (let pass = 0; pass < 3; pass++) {
    let moved = false;
    for (const i of shown) {
      const next = pick(i, shown);
      if (next !== choice[i]) {
        choice[i] = next;
        moved = true;
      }
    }
    if (!moved) break;
  }

  return shown.map((i) => {
    const { r, shape } = spots[i]![choice[i]];
    const { x: cx, y: cy } = pts[i];
    const nx = Math.min(Math.max(cx, r.x), r.x + r.w);
    const ny = Math.min(Math.max(cy, r.y), r.y + r.h);
    const len = Math.hypot(nx - cx, ny - cy);
    const stem =
      len > 14
        ? { x1: cx + ((nx - cx) / len) * 9, y1: cy + ((ny - cy) / len) * 9, x2: nx, y2: ny }
        : null;
    return { id: order[i].id, index: i, left: r.x, top: r.y, width: r.w, height: r.h, shape, stem };
  });
}
