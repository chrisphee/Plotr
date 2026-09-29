import { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  useStore,
  type EdgeProps,
  type Edge,
  type InternalNode,
} from "@xyflow/react";
import clsx from "clsx";
import { infomap } from "./infomapActions";

export type ConnEdgeType = Edge<{ boardId: string; label: string }, "conn">;

/* Straight connection with an optional text label. Double-click the label
   (or a selected edge's midpoint) to edit it. */

const LABEL_STOPS = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8];

/** The point nearest the middle of the edge that no card covers. */
function freeLabelPoint(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  nodes: Map<string, InternalNode>,
): [number, number] {
  const boxes = [...nodes.values()]
    .filter((n) => n.type !== "frame")
    .map((n) => ({
      x: n.internals.positionAbsolute.x,
      y: n.internals.positionAbsolute.y,
      w: n.measured.width ?? 0,
      h: n.measured.height ?? 0,
    }));
  for (const t of LABEL_STOPS) {
    const x = sx + (tx - sx) * t;
    const y = sy + (ty - sy) * t;
    const hit = boxes.some((b) => x > b.x - 30 && x < b.x + b.w + 30 && y > b.y - 10 && y < b.y + b.h + 10);
    if (!hit) return [x, y];
  }
  return [(sx + tx) / 2, (sy + ty) / 2];
}

export function ConnEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
  markerEnd,
}: EdgeProps<ConnEdgeType>) {
  const [editing, setEditing] = useState(false);
  const nodeLookup = useStore((s) => s.nodeLookup);
  const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const [labelX, labelY] = freeLabelPoint(sourceX, sourceY, targetX, targetY, nodeLookup);
  const label = data?.label ?? "";

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        {(label || selected) && (
          <div
            className={clsx("imedge__label", selected && "imedge__label--selected", "nodrag", "nopan")}
            style={{ left: labelX, top: labelY }}
            onDoubleClick={() => setEditing(true)}
          >
            {editing ? (
              <input
                autoFocus
                defaultValue={label}
                placeholder="label"
                onFocus={(e) => e.target.select()}
                onBlur={(e) => {
                  if (data) infomap.setConnectionLabel(data.boardId, id, e.target.value.trim());
                  setEditing(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  e.stopPropagation();
                }}
              />
            ) : (
              <span>{label || "· ·"}</span>
            )}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
