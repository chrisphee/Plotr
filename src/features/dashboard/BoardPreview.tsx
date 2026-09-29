import type { Board } from "../../lib/schema";

/* A tiny live render of a board's data for dashboard rows. */

const W = 190;
const H = 50;

export function BoardPreview({ board }: { board: Board | undefined | "folder" }) {
  return (
    <div className="bprev" aria-hidden>
      {board === "folder" || board?.type === "notes" ? (
        <div className="bprev__bars">
          <span style={{ width: "82%" }} />
          <span style={{ width: "64%" }} />
          <span style={{ width: "72%" }} />
        </div>
      ) : board?.type === "plotline" ? (
        <PlotPreview board={board} />
      ) : board?.type === "infomap" ? (
        <MapPreview board={board} />
      ) : null}
    </div>
  );
}

function PlotPreview({ board }: { board: Extract<Board, { type: "plotline" }> }) {
  if (board.points.length === 0) return null;
  const pts = [...board.points]
    .sort((a, b) => a.x - b.x)
    .map((p) => `${(p.x * W).toFixed(1)},${((1 - p.y) * H).toFixed(1)}`)
    .join(" ");
  return (
    <svg className="bprev__inset" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1.6}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function MapPreview({ board }: { board: Extract<Board, { type: "infomap" }> }) {
  const byId = new Map(board.items.map((i) => [i.id, i]));
  const centres = board.items
    .filter((i) => i.kind !== "group")
    .map((i) => {
      const parent = i.parentId ? byId.get(i.parentId) : undefined;
      return {
        x: i.x + (parent?.x ?? 0) + i.w / 2,
        y: i.y + (parent?.y ?? 0) + i.h / 2,
      };
    })
    .slice(0, 16);
  if (centres.length === 0) return null;
  const xs = centres.map((c) => c.x);
  const ys = centres.map((c) => c.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(...xs) - minX;
  const spanY = Math.max(...ys) - minY;
  return (
    <div className="bprev__inset">
      {centres.map((c, i) => (
        <span
          key={i}
          className="bprev__dot"
          style={{
            left: `${spanX ? ((c.x - minX) / spanX) * 100 : 50}%`,
            top: `${spanY ? ((c.y - minY) / spanY) * 100 : 50}%`,
          }}
        />
      ))}
    </div>
  );
}
