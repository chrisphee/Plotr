import { useProject } from "../../stores/projectStore";
import { FolderLayout } from "./DashboardScreen";

/** Drill-down view of one folder: the dashboard layout, scoped to the folder. */
export function FolderScreen({ folderId }: { folderId: string }) {
  const folder = useProject((s) => s.treeItems.find((t) => t.id === folderId));
  if (!folder) return null;
  return <FolderLayout key={folderId} parentId={folderId} title={folder.name} />;
}
