import { useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { X } from "lucide-react";
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
import { AppShell, PrimaryAction } from "../../components/shell/TopBar";
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
    <AppShell
      actions={
        <>
          <Button variant="ghost" onClick={() => navigate({ name: "connectors" })}>
            Connectors
          </Button>
          <Button variant="ghost" onClick={() => navigate({ name: "appSettings" })}>
            App settings
          </Button>
        </>
      }
    >
      <div className="page start">
        <div className="page__head">
          <h1 className="page__title">Your projects</h1>
          <p className="page__lede">
            A quiet workspace for stories — plot lines, maps of ideas, and every note in its place.
          </p>
          <div className="start__actions">
            <PrimaryAction label="New project" size="lg" onClick={() => setCreating(true)} />
            <Button size="lg" onClick={() => void openExisting()}>
              Open project…
            </Button>
            <Button size="lg" onClick={() => void importBackup()}>
              Import backup…
            </Button>
          </div>
        </div>

        {error && <p className="start__error">{error}</p>}

        {recents.length === 0 ? (
          <EmptyState
            title="No projects yet"
            message="Create your first project — it lives in a folder you choose, fully offline."
          />
        ) : (
          <div className="lgroup">
            <div className="lgroup__label">
              <span>Recent</span>
              <span>Last opened</span>
            </div>
            {recents.map((r) => (
              <div
                key={r.path}
                className="lrow start__row"
                role="button"
                tabIndex={0}
                onClick={() => void tryOpen(r.path)}
                onKeyDown={(e) => e.key === "Enter" && void tryOpen(r.path)}
              >
                <ProjectCover recent={r} />
                <div className="start__text">
                  <span className="lrow__name">{r.name}</span>
                  <span className="lrow__mono start__path" title={r.path}>
                    {r.path}
                  </span>
                </div>
                <span className="start__when">
                  <span className="lrow__mono">{shortDate(r.openedAt)}</span>
                  <IconButton
                    label="Remove from recents"
                    className="lrow__reveal"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRemoving(r);
                    }}
                  >
                    <X size={15} strokeWidth={1.75} />
                  </IconButton>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {creating && (
        <CreateProjectModal
          onClose={() => setCreating(false)}
          onError={(msg) => setError(msg)}
        />
      )}

      {removing && (
        <ConfirmDialog
          title="Remove from recent projects?"
          message={`"${removing.name}" will disappear from this list. The project folder and all its files stay on disk — you can open it again anytime with Open project.`}
          confirmLabel="Remove"
          onConfirm={() => {
            removeRecent(removing.path);
            setRemoving(null);
          }}
          onCancel={() => setRemoving(null)}
        />
      )}
    </AppShell>
  );
}

function ProjectCover({ recent }: { recent: RecentProject }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(recent.coverImage) && !imgFailed;
  const color = recent.color ?? null;
  const tone = color ? readableTextOn(color) : "light";

  return (
    <div className="minicover" style={color ? { background: color } : undefined} data-tone={tone}>
      {showImage ? (
        <img
          src={assetUrl(recent.path, recent.coverImage!)}
          alt=""
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="minicover__rule" />
      )}
    </div>
  );
}
