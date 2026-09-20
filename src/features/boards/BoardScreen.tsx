import { useProject } from "../../stores/projectStore";
import { NotesBoardScreen } from "../notes-board/NotesBoardScreen";
import { PlotLineScreen } from "../plotline/PlotLineScreen";
import { InfoMapScreen } from "../infomap/InfoMapScreen";

/* Routes a board id to its board-type screen. */

export function BoardScreen({ boardId }: { boardId: string }) {
  const treeItems = useProject((s) => s.treeItems);
  const item = treeItems.find((t) => t.id === boardId);
  if (!item || item.kind !== "board") return null;

  switch (item.boardType) {
    case "notes":
      return <NotesBoardScreen treeItem={item} />;
    case "plotline":
      return <PlotLineScreen treeItem={item} />;
    case "infomap":
      return <InfoMapScreen treeItem={item} />;
  }
}
