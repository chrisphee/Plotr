import { useId } from "react";
import { Folder } from "lucide-react";
import { useNotes } from "../../stores/notesStore";
import { useProject } from "../../stores/projectStore";
import type { Board, InfoMapBoard, Note, NotesBoard, PlotLineBoard, TreeItem } from "../../lib/schema";
import { monotonePath } from "../../lib/spline";
import { assetUrl } from "../../tauri/commands";
import { extractPreview } from "../notes-board/preview";
import { boardTypeInfo } from "./boardTypes";

/* A live miniature of a board, drawn from its own data. */

export function BoardPreview({ board }: { board: Board | undefined }) {
  if (!board) return <div className="bprev" aria-hidden />;
  const empty =
    (board.type === "plotline" && board.points.length === 0) ||
    (board.type === "infomap" && board.items.length === 0) ||
    (board.type === "notes" && board.noteRefs.length === 0);

  return (
    <div className="bprev" aria-hidden>
      {empty ? (
        <span className="bprev__empty">{boardTypeInfo(board.type).icon(22)}</span>
      ) : board.type === "plotline" ? (
        <PlotPreview board={board} />
      ) : board.type === "infomap" ? (
        <MapPreview board={board} />
      ) : (
        <NotesPreview board={board} />
      )}
    </div>
  );
}

const W = 240;
const H = 100;

function PlotPreview({ board }: { board: PlotLineBoard }) {
  const gradient = "bpg" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const pts = [...board.points]
    .sort((a, b) => a.x - b.x)
    .map((p) => ({ x: p.x * W, y: 8 + (1 - p.y) * (H - 16) }));
  const line = monotonePath(pts);
  const area = `${line} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
  const sections = [...board.sections].sort((a, b) => a.start - b.start);

  return (
    <div className="bprev__inset bprev__inset--plot">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {sections.map((s, i) =>
          i % 2 === 0 ? (
            <rect key={s.id} x={s.start * W} y={0} width={(s.end - s.start) * W} height={H} fill="var(--band)" />
          ) : null,
        )}
        {pts.length > 1 && <path d={area} fill={`url(#${gradient})`} />}
        {pts.length > 1 && (
          <path
            d={line}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {pts.map((p, i) => (
        <span
          key={i}
          className="bprev__dot"
          style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}
        />
      ))}
    </div>
  );
}

function MapPreview({ board }: { board: InfoMapBoard }) {
  const notes = useNotes((s) => s.notes);
  const projectPath = useProject((s) => s.projectPath);
  const byId = new Map(board.items.map((i) => [i.id, i]));
  const abs = board.items.map((i) => {
    const parent = i.parentId ? byId.get(i.parentId) : undefined;
    return { ...i, ax: i.x + (parent?.x ?? 0), ay: i.y + (parent?.y ?? 0) };
  });
  const minX = Math.min(...abs.map((i) => i.ax));
  const minY = Math.min(...abs.map((i) => i.ay));
  const maxX = Math.max(...abs.map((i) => i.ax + i.w));
  const maxY = Math.max(...abs.map((i) => i.ay + i.h));
  const pad = Math.max(maxX - minX, maxY - minY) * 0.04;
  const w = maxX - minX + pad * 2;
  const h = maxY - minY + pad * 2;
  const box = (i: { ax: number; ay: number; w: number; h: number }) => ({
    left: `${((i.ax - minX + pad) / w) * 100}%`,
    top: `${((i.ay - minY + pad) / h) * 100}%`,
    width: `${(i.w / w) * 100}%`,
    height: `${(i.h / h) * 100}%`,
  });
  const centre = new Map(abs.map((i) => [i.id, { x: i.ax - minX + pad + i.w / 2, y: i.ay - minY + pad + i.h / 2 }]));

  return (
    <div className="bprev__fit" style={{ "--ratio": w / h } as React.CSSProperties}>
      <div className="bprev__map">
        {abs
          .filter((i) => i.kind === "group")
          .map((i) => (
            <span key={i.id} className="bprev__group" style={box(i)} />
          ))}
        <svg className="bprev__links" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          {board.connections.map((c) => {
            const a = centre.get(c.from);
            const b = centre.get(c.to);
            return a && b ? (
              <line
                key={c.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--text-3)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ) : null;
          })}
        </svg>
        {abs.map((i) => {
          switch (i.kind) {
            case "note":
              return (
                <span key={i.id} className="bprev__node" style={box(i)}>
                  <span className="bprev__nodetitle">{notes[i.noteId]?.title || "Untitled note"}</span>
                </span>
              );
            case "image":
              return (
                <span key={i.id} className="bprev__node bprev__node--image" style={box(i)}>
                  {projectPath && <img src={assetUrl(projectPath, i.assetPath)} alt="" loading="lazy" />}
                </span>
              );
            case "text":
              return (
                <span key={i.id} className="bprev__label" style={box(i)}>
                  {i.text}
                </span>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

/* A notes board as the first page of a document: titles and opening lines. */
function NotesPreview({ board }: { board: NotesBoard }) {
  const notes = useNotes((s) => s.notes);
  const categories = useProject((s) => s.meta?.categories ?? []);
  const rows = [...board.noteRefs]
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.order - b.order)
    .slice(0, 3)
    .map((r) => notes[r.noteId])
    .filter((n): n is Note => Boolean(n));

  return (
    <div className="bprev__doc">
      {rows.map((n, i) => {
        const color = n.color ?? categories.find((c) => c.id === n.categoryIds[0])?.color ?? null;
        const text = extractPreview(n.doc);
        return (
          <span key={n.id} className="bprev__entry">
            <span className="bprev__entrytitle">
              {color && <span className="bprev__bullet" style={{ background: color }} />}
              {n.title || "Untitled note"}
            </span>
            {text && (
              <span
                className="bprev__entrytext"
                style={{ WebkitLineClamp: rows.length === 1 ? 4 : i === 0 && rows.length === 2 ? 2 : 1 }}
              >
                {text}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/** A folder's miniature: the names of what it holds. */
export function FolderPreview({ items }: { items: TreeItem[] }) {
  return (
    <div className="bprev" aria-hidden>
      {items.length === 0 ? (
        <span className="bprev__empty">
          <Folder size={22} strokeWidth={1.75} />
        </span>
      ) : (
        <div className="bprev__list">
          {items.slice(0, 4).map((it) => (
            <span key={it.id} className="bprev__line">
              <span className="bprev__lineicon">
                {it.kind === "folder" ? <Folder size={12} strokeWidth={2} /> : boardTypeInfo(it.boardType).icon(12)}
              </span>
              <span className="bprev__text">{it.name}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
