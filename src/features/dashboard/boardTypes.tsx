import { Network, StickyNote, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import type { Board, BoardType } from "../../lib/schema";

export const BOARD_TYPES: {
  type: BoardType;
  name: string;
  description: string;
  icon: (size?: number) => ReactNode;
}[] = [
  {
    type: "plotline",
    name: "Plot Line",
    description: "Arrange story moments along a timeline and shape pacing by feel.",
    icon: (size = 18) => <TrendingUp size={size} strokeWidth={1.75} />,
  },
  {
    type: "infomap",
    name: "Info Map",
    description: "A freeform canvas for characters, places, and how they connect.",
    icon: (size = 18) => <Network size={size} strokeWidth={1.75} />,
  },
  {
    type: "notes",
    name: "Notes",
    description: "A structured library of notes, organised into folders.",
    icon: (size = 18) => <StickyNote size={size} strokeWidth={1.75} />,
  },
];

export function boardTypeInfo(type: BoardType) {
  return BOARD_TYPES.find((t) => t.type === type)!;
}

export function boardItemCount(board: Board | undefined): number {
  if (!board) return 0;
  switch (board.type) {
    case "notes":
      return board.noteRefs.length;
    case "plotline":
      return board.points.length;
    case "infomap":
      return board.items.length;
  }
}
