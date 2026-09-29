import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { useNav } from "../../app/navStore";
import { useProject } from "../../stores/projectStore";
import "./shell.css";

interface Crumb {
  label: string;
  /** null = not clickable (the current screen). */
  onClick: (() => void) | null;
}

const TITLES = {
  trash: "Trash",
  projectSettings: "Project settings",
  search: "Search",
  appSettings: "App settings",
  connectors: "Connectors",
} as const;

/** The path to the current screen: "Home", "Story › Main Plot", "Plotr › App settings". */
export function Breadcrumb() {
  const screen = useNav((s) => s.screen);
  const navigate = useNav((s) => s.navigate);
  const hasProject = useProject((s) => s.projectPath !== null);
  const pathOf = useProject((s) => s.pathOf);
  useProject((s) => s.treeItems);

  const crumbs: Crumb[] = [];
  if (screen.name === "dashboard") {
    crumbs.push({ label: "Home", onClick: null });
  } else if (screen.name === "folder" || screen.name === "board") {
    const id = screen.name === "folder" ? screen.folderId : screen.boardId;
    for (const item of pathOf(id)) {
      crumbs.push({
        label: item.name,
        onClick: () =>
          navigate(
            item.kind === "folder" ? { name: "folder", folderId: item.id } : { name: "board", boardId: item.id },
          ),
      });
    }
  } else if (screen.name in TITLES) {
    if (!hasProject) crumbs.push({ label: "Plotr", onClick: () => navigate({ name: "start" }) });
    crumbs.push({ label: TITLES[screen.name as keyof typeof TITLES], onClick: null });
  }

  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <Fragment key={i}>
            {i > 0 && <ChevronRight className="crumbs__sep" size={14} strokeWidth={2} aria-hidden />}
            {isLast ? (
              <span className="crumbs__item crumbs__item--current" title={c.label} aria-current="page">
                {c.label}
              </span>
            ) : (
              <button className="crumbs__item" onClick={() => c.onClick?.()} title={c.label}>
                {c.label}
              </button>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
