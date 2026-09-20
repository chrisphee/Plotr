import { useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { Archive, BookOpen, FolderOpen, Plus, Settings, X } from "lucide-react";
import { importZip } from "../../tauri/commands";
import { useSettings, type RecentProject } from "../../stores/settingsStore";
import { useProject } from "../../stores/projectStore";
import { useNav } from "../../app/navStore";
import { probeProject, assetUrl } from "../../tauri/commands";
import { readableTextOn } from "../../lib/color";
import { Button, IconButton } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { CreateProjectModal } from "./CreateProjectModal";
import "../../components/shell/shell.css";
import "./start.css";

export function StartScreen() {
  const recents = useSettings((s) => s.recents);
  const removeRecent = useSettings((s) => s.removeRecent);
  const openProject = useProject((s) => s.open);
  const navigate = useNav((s) => s.navigate);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<RecentProject | null>(null);

  const openExisting = async () => {
    const dir = await openDialog({
      directory: true,
      title: "Open a Plotr project folder",
    });
    if (typeof dir !== "string") return;
    await tryOpen(dir);
  };

  const importBackup = async () => {
    const zip = await openDialog({
      title: "Import a Plotr backup",
      filters: [{ name: "Plotr backup", extensions: ["zip"] }],
    });
    if (typeof zip !== "string") return;
    const dest = await openDialog({
      directory: true,
      title: "Where should the imported project live?",
    });
    if (typeof dest !== "string") return;
    setError(null);
    try {
      const projectPath = await importZip(zip, dest);
      await openProject(projectPath);
    } catch (e) {
      setError(String(e));
    }
  };

  const tryOpen = async (path: string) => {
    setError(null);
    try {
      if (!(await probeProject(path))) {
        setError("That folder is not a Plotr project — it has no project.json.");
        return;
      }
      await openProject(path);
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="shell">
      <aside className="spine">
        <div className="spine__brand">
          <BookOpen size={20} style={{ verticalAlign: "-4px", marginRight: 8 }} />
          Plotr
        </div>
        <p className="spine__desc">
          A quiet workspace for stories — plot lines, maps of ideas, and every
          note in its place.
        </p>
        <div className="spine__actions">
          <Button variant="primary-on-ink" onClick={() => setCreating(true)}>
            <Plus size={15} /> New Project
          </Button>
          <Button variant="ghost-on-ink" onClick={openExisting}>
            <FolderOpen size={15} /> Open Project…
          </Button>
        </div>
        <div className="spine__spacer" />
        <nav className="spine__nav">
          <button className="spine__navitem" onClick={() => void importBackup()}>
            <Archive size={15} /> Import Backup…
          </button>
          <button
            className="spine__navitem"
            onClick={() => navigate({ name: "appSettings" })}
          >
            <Settings size={15} /> App Settings
          </button>
        </nav>
      </aside>

      <main className="shell__main">
        <div className="start__main">
          <div className="start__shelf-label">
            <span className="eyebrow">Recent projects</span>
          </div>
          {error && (
            <p className="meta" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          {recents.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={28} strokeWidth={1.5} />}
              title="No projects yet"
              message="Create your first project — it lives in a folder you choose, fully offline."
              action={
                <Button variant="primary" onClick={() => setCreating(true)}>
                  <Plus size={15} /> Create Project
                </Button>
              }
            />
          ) : (
            <div className="start__covers">
              {recents.map((r) => (
                <div key={r.path} style={{ position: "relative" }}>
                  <button className="cover" onClick={() => void tryOpen(r.path)}>
                    <ProjectCover recent={r} />
                    <div>
                      <div className="cover__name">{r.name}</div>
                      <div className="cover__meta" title={r.path}>
                        {r.path}
                      </div>
                    </div>
                  </button>
                  <div style={{ position: "absolute", top: 6, right: 6 }}>
                    <IconButton
                      label="Remove from recents"
                      onClick={() => setRemoving(r)}
                      style={{ color: "var(--ink-text-muted)" }}
                    >
                      <X size={14} />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {creating && (
        <CreateProjectModal
          onClose={() => setCreating(false)}
          onError={(msg) => setError(msg)}
        />
      )}

      {removing && (
        <ConfirmDialog
          title="Remove from recent projects?"
          message={`"${removing.name}" will disappear from this list. The project folder and all its files stay on disk — you can open it again anytime with Open Project.`}
          confirmLabel="Remove"
          onConfirm={() => {
            removeRecent(removing.path);
            setRemoving(null);
          }}
          onCancel={() => setRemoving(null)}
        />
      )}
    </div>
  );
}

function ProjectCover({ recent }: { recent: RecentProject }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(recent.coverImage) && !imgFailed;
  const color = recent.color ?? null;
  const textTone = color ? readableTextOn(color) : "light";

  return (
    <div
      className="cover__face"
      style={color ? { background: color } : undefined}
      data-text={textTone}
    >
      {showImage && (
        <img
          src={assetUrl(recent.path, recent.coverImage!)}
          alt=""
          onError={() => setImgFailed(true)}
        />
      )}
      <div className="cover__title">{recent.name}</div>
      <div className="cover__rule" />
    </div>
  );
}
