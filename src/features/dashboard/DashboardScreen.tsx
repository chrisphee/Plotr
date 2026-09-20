import { Search, Settings, Trash2, X } from "lucide-react";
import { useNav } from "../../app/navStore";
import { useProject } from "../../stores/projectStore";
import { assetUrl } from "../../tauri/commands";
import { Shelves } from "./Shelves";
import { Dock } from "../../components/shell/Dock";
import "../../components/shell/shell.css";
import "./dashboard.css";

export function DashboardScreen() {
  const meta = useProject((s) => s.meta);
  const projectPath = useProject((s) => s.projectPath);
  const close = useProject((s) => s.close);
  const treeItems = useProject((s) => s.treeItems);
  const navigate = useNav((s) => s.navigate);

  if (!meta || !projectPath) return null;

  const boardCount = treeItems.filter((t) => t.kind === "board").length;
  const folderCount = treeItems.filter((t) => t.kind === "folder").length;

  return (
    <div className="shell">
      <aside className="spine">
        <div className="spine__brand">Plotr</div>
        {meta.coverImage && (
          <img className="spine__cover" src={assetUrl(projectPath, meta.coverImage)} alt="" />
        )}
        <h1 className="spine__title">{meta.name}</h1>
        {meta.description && <p className="spine__desc">{meta.description}</p>}
        <div className="spine__meta">
          {meta.genre && <span>{meta.genre}</span>}
          {meta.status && <span>{meta.status}</span>}
          <span>
            {boardCount} {boardCount === 1 ? "board" : "boards"} · {folderCount}{" "}
            {folderCount === 1 ? "folder" : "folders"}
          </span>
        </div>
        <div className="spine__spacer" />
        <nav className="spine__nav">
          <button className="spine__navitem" onClick={() => navigate({ name: "search", query: "" })}>
            <Search size={15} /> Search
          </button>
          <button className="spine__navitem" onClick={() => navigate({ name: "trash" })}>
            <Trash2 size={15} /> Trash
          </button>
          <button
            className="spine__navitem"
            onClick={() => navigate({ name: "projectSettings" })}
          >
            <Settings size={15} /> Project Settings
          </button>
          <button className="spine__navitem" onClick={() => void close()}>
            <X size={15} /> Close Project
          </button>
        </nav>
      </aside>

      <main className="shell__main">
        <div className="dash__main">
          <Shelves parentId={null} />
        </div>
        <Dock withSpine />
      </main>
    </div>
  );
}
