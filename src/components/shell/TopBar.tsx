import { type ReactNode } from "react";
import clsx from "clsx";
import { useProject } from "../../stores/projectStore";
import { useSettings } from "../../stores/settingsStore";
import { saveQueue, useSaveState } from "../../lib/saveQueue";
import { useSearch } from "../../features/search/searchStore";
import { useKeyShortcut } from "../../app/shortcuts";
import { Button, Kbd } from "../ui/Button";
import { Breadcrumb } from "./Breadcrumb";
import { LogoMark } from "./LogoMark";
import "./shell.css";

interface AppShellProps {
  /** Contextual actions for this screen, rendered on the right of the top bar. */
  actions?: ReactNode;
  /** "always" shows "Saved" when clean; "auto" only speaks up when work is unsaved. */
  saveStatus?: "auto" | "always";
  /** Canvas screens clip instead of scrolling. */
  canvas?: boolean;
  children: ReactNode;
}

export function AppShell({ actions, saveStatus = "auto", canvas, children }: AppShellProps) {
  return (
    <div className="shell">
      <TopBar actions={actions} saveStatus={saveStatus} />
      <main className={clsx("shell__main", canvas && "shell__main--canvas")}>{children}</main>
    </div>
  );
}

function TopBar({ actions, saveStatus }: { actions?: ReactNode; saveStatus: "auto" | "always" }) {
  const hasProject = useProject((s) => s.projectPath !== null);
  const openSearch = () => useSearch.getState().setOverlayOpen(true);

  return (
    <header className="topbar">
      <div className="topbar__left">
        <LogoMark />
        <Breadcrumb />
      </div>
      <button className="cmdfield" onClick={openSearch}>
        <span className="cmdfield__text">
          {hasProject ? "Search notes, boards, or run a command" : "Search projects"}
        </span>
        <span className="cmdfield__keys">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
      <div className="topbar__right">
        <SaveStatus always={saveStatus === "always"} />
        {actions}
      </div>
    </header>
  );
}

/** The one primary button on a screen, with its single-key shortcut. */
export function PrimaryAction({
  label,
  shortcut = "N",
  onClick,
  size,
}: {
  label: string;
  shortcut?: string;
  onClick: () => void;
  size?: "md" | "lg";
}) {
  useKeyShortcut(shortcut, onClick);
  return (
    <Button variant="primary" size={size} onClick={onClick}>
      {label}
      <Kbd>{shortcut}</Kbd>
    </Button>
  );
}

export function SaveStatus({ always }: { always?: boolean }) {
  const autosave = useSettings((s) => s.autosave);
  const pendingCount = useSaveState((s) => s.pendingCount);
  const saving = useSaveState((s) => s.saving);

  if (saving) {
    return (
      <span className="savestatus">
        <span className="statusdot statusdot--pending" />
        <span className="savestatus__label">Saving…</span>
      </span>
    );
  }
  if (!autosave && pendingCount > 0) {
    return (
      <button className="savestatus" onClick={() => void saveQueue.flush()} title="Save now (Ctrl+S)">
        <span className="statusdot statusdot--pending" />
        <span className="savestatus__label">Unsaved</span>
      </button>
    );
  }
  if (!always) return null;
  return (
    <span className="savestatus">
      <span className="statusdot" />
      <span className="savestatus__label">Saved</span>
    </span>
  );
}
