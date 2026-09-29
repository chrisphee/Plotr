import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { PanelLeft, Plus } from "lucide-react";
import { useProject } from "../../stores/projectStore";
import { useSettings } from "../../stores/settingsStore";
import { saveQueue, useSaveState } from "../../lib/saveQueue";
import { useKeyShortcut } from "../../app/shortcuts";
import { Button, IconButton } from "../ui/Button";
import { Breadcrumb } from "./Breadcrumb";
import { Sidebar } from "./Sidebar";
import { useSidebar } from "./sidebarStore";
import "./shell.css";

interface AppShellProps {
  /** Contextual actions for this screen, rendered on the right of the header. */
  actions?: ReactNode;
  /** A short fact after the title, e.g. "12 moments". */
  subtitle?: string;
  /** "always" shows "Saved" when clean; "auto" only speaks up when work is unsaved. */
  saveStatus?: "auto" | "always";
  /** Canvas screens clip instead of scrolling. */
  canvas?: boolean;
  /** Settings pages sit on the grouped grey ground. */
  grouped?: boolean;
  /** The page shows its own large title; the header shows it only once that scrolls away. */
  largeTitle?: boolean;
  children: ReactNode;
}

export function AppShell({
  actions,
  subtitle,
  saveStatus = "auto",
  canvas,
  grouped,
  largeTitle,
  children,
}: AppShellProps) {
  const hasProject = useProject((s) => s.projectPath !== null);
  const collapsed = useSidebar((s) => s.collapsed);
  const toggle = useSidebar((s) => s.toggleCollapsed);
  const [scrolled, setScrolled] = useState(false);
  const [pastTitle, setPastTitle] = useState(false);
  const showSidebar = hasProject && !collapsed;

  return (
    <div className={clsx("app", showSidebar && "app--sidebar")}>
      {hasProject && (
        <div className="app__sidebar" aria-hidden={collapsed || undefined} inert={collapsed || undefined}>
          <Sidebar />
        </div>
      )}
      <div className="app__main">
        <header
          className={clsx(
            "header",
            (canvas || scrolled) && "header--ruled",
            largeTitle && !pastTitle && "header--titlehidden",
          )}
        >
          <div className="header__left">
            {hasProject && (
              <IconButton
                label={collapsed ? "Show sidebar (Ctrl+\\)" : "Hide sidebar (Ctrl+\\)"}
                onClick={toggle}
                aria-pressed={!collapsed}
              >
                <PanelLeft size={17} strokeWidth={1.75} />
              </IconButton>
            )}
            <Breadcrumb />
            {subtitle && <span className="header__subtitle">{subtitle}</span>}
          </div>
          <div className="header__right">
            <SaveStatus always={saveStatus === "always"} />
            {actions}
          </div>
        </header>
        <main
          className={clsx("content", canvas && "content--canvas", grouped && "content--grouped")}
          onScroll={
            canvas
              ? undefined
              : (e) => {
                  setScrolled(e.currentTarget.scrollTop > 4);
                  setPastTitle(e.currentTarget.scrollTop > 60);
                }
          }
        >
          {children}
        </main>
      </div>
    </div>
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
    <Button variant="primary" size={size} onClick={onClick} title={`${label} (${shortcut})`}>
      <Plus size={15} strokeWidth={2.25} />
      {label}
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
        <span className="statusdot statusdot--busy" />
        <span className="savestatus__label">Saving…</span>
      </span>
    );
  }
  if (!autosave && pendingCount > 0) {
    return (
      <button className="savestatus savestatus--pending" onClick={() => void saveQueue.flush()} title="Save now (Ctrl+S)">
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
