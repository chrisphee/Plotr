import { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";
import clsx from "clsx";
import { infomap } from "./infomapActions";

export type ConnEdgeType = Edge<{ boardId: string; label: string }, "conn">;

/* Straight connection with an optional centred text label. Double-click the
   label (or a selected edge's midpoint) to edit it. */

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
  const [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
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
