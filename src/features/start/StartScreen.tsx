import { useState, type ReactNode } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { Archive, FolderOpen, Plug, Plus, SlidersHorizontal, X } from "lucide-react";
import { importZip, probeProject } from "../../tauri/commands";
import { useSettings, type RecentProject } from "../../stores/settingsStore";
import { useProject } from "../../stores/projectStore";
import { useNav } from "../../app/navStore";
import { useKeyShortcut } from "../../app/shortcuts";
import { IconButton, Kbd } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { LogoMark } from "../../components/shell/LogoMark";
import { ProjectCover } from "../../components/shell/ProjectCover";
import { CreateProjectModal } from "./CreateProjectModal";
import { shortDate } from "../../lib/time";
import "./start.css";

export function StartScreen() {
  const recents = useSettings((s) => s.recents);
  const removeRecent = useSettings((s) => s.removeRecent);
  const openProject = useProject((s) => s.open);
  const navigate = useNav((s) => s.navigate);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<RecentProject | null>(null);

  useKeyShortcut("n", () => setCreating(true));

  const openExisting = async () => {
    const dir = await openDialog({ directory: true, title: "Open a Plotr project folder" });
    if (typeof dir !== "string") return;
    await tryOpen(dir);
  };

  const importBackup = async () => {
    const zip = await openDialog({
      title: "Import a Plotr backup",
      filters: [{ name: "Plotr backup", extensions: ["zip"] }],
    });
    if (typeof zip !== "string") return;
    const dest = await openDialog({ directory: true, title: "Where should the imported project live?" });
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
        setError("That folder is not a Plotr project. It has no project.json.");
        return;
      }
      await openProject(path);
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="welcome">
      <section className="welcome__intro">
        <div className="welcome__brand">
          <span className="welcome__icon">
            <LogoMark className="welcome__logo" />
          </span>
          <h1 className="welcome__name">Plotr</h1>
          <p className="welcome__tagline">A quiet workspace for stories</p>
        </div>

        <div className="welcome__actions">
          <ActionRow
            icon={<Plus size={18} strokeWidth={2} />}
            title="New project"
            description="Start a story in a folder you choose"
            hint={<Kbd>N</Kbd>}
            primary
            onClick={() => setCreating(true)}
          />
          <ActionRow
            icon={<FolderOpen size={18} strokeWidth={1.75} />}
            title="Open project…"
            description="Open a .plotr folder from disk"
            onClick={() => void openExisting()}
          />
          <ActionRow
            icon={<Archive size={18} strokeWidth={1.75} />}
            title="Import backup…"
            description="Restore a project from a .zip backup"
            onClick={() => void importBackup()}
          />
        </div>

        <div className="welcome__links">
          <button className="textbtn" onClick={() => navigate({ name: "appSettings" })}>
            <SlidersHorizontal size={14} strokeWidth={1.75} />
            App settings
          </button>
          <button className="textbtn" onClick={() => navigate({ name: "connectors" })}>
            <Plug size={14} strokeWidth={1.75} />
            Connectors
          </button>
        </div>
      </section>

      <section className="welcome__recents" aria-label="Recent projects">
        <h2 className="welcome__heading">Recent projects</h2>
        {error && (
          <p className="welcome__error" role="alert">
            {error}
          </p>
        )}
        {recents.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={22} strokeWidth={1.75} />}
            title="No projects yet"
            message="Create your first project. It lives in a folder you choose and works fully offline."
          />
        ) : (
          <div className="recents">
            {recents.map((r) => (
              <div key={r.path} className="recent" title={r.path}>
                <button className="recent__hit" onClick={() => void tryOpen(r.path)} aria-label={`Open ${r.name}`} />
                <ProjectCover path={r.path} name={r.name} coverImage={r.coverImage} color={r.color} size={40} />
                <div className="recent__text">
                  <span className="recent__name">{r.name}</span>
                  <span className="recent__sub">{r.description || folderName(r.path)}</span>
                </div>
                <span className="recent__when">{shortDate(r.openedAt)}</span>
                <IconButton
                  label={`Remove ${r.name} from recents`}
                  className="recent__remove"
                  onClick={() => setRemoving(r)}
                >
                  <X size={15} strokeWidth={2} />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </section>

      {creating && <CreateProjectModal onClose={() => setCreating(false)} onError={(msg) => setError(msg)} />}

      {removing && (
        <ConfirmDialog
          title="Remove from recent projects?"
          message={`"${removing.name}" will disappear from this list. The project folder and all its files stay on disk. You can open it again anytime with Open project.`}
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

function ActionRow({
  icon,
  title,
  description,
  hint,
  primary,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  hint?: ReactNode;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={primary ? "action action--primary" : "action"} onClick={onClick}>
      <span className="action__icon">{icon}</span>
      <span className="action__text">
        <span className="action__title">{title}</span>
        <span className="action__desc">{description}</span>
      </span>
      {hint && <span className="action__hint">{hint}</span>}
    </button>
  );
}

/** "…\Plotr Notes\THERMITE.plotr" → "Plotr Notes". */
function folderName(path: string): string {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 2] : path;
}
