import { useProject } from "../../stores/projectStore";
import { Dock } from "../../components/shell/Dock";
import { Shelves } from "./Shelves";
import "./dashboard.css";

/** Drill-down view of one folder: same shelf layout, scoped to the folder. */
export function FolderScreen({ folderId }: { folderId: string }) {
  const treeItems = useProject((s) => s.treeItems);
  const folder = treeItems.find((t) => t.id === folderId);
  if (!folder) return null;

  return (
    <main className="shell__main" style={{ height: "100%" }}>
      <div className="dash__main">
        <div className="dash__header">
          <h1 className="dash__boardtitle">{folder.name}</h1>
        </div>
        <Shelves parentId={folderId} />
      </div>
      <Dock />
    </main>
  );
}
