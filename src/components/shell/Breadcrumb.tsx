import { Fragment } from "react";
import clsx from "clsx";
import { useNav } from "../../app/navStore";
import { useProject } from "../../stores/projectStore";
import "./shell.css";

interface Crumb {
  label: string;
  /** null = not clickable (the current screen). */
  onClick: (() => void) | null;
}

/** "Projects / The Silent Kingdom" on the dashboard, "Kingdom / Story / Main Plot" deeper in. */
export function Breadcrumb() {
  const screen = useNav((s) => s.screen);
  const navigate = useNav((s) => s.navigate);
  const meta = useProject((s) => s.meta);
  const pathOf = useProject((s) => s.pathOf);
  const close = useProject((s) => s.close);
  useProject((s) => s.treeItems);

  const crumbs: Crumb[] = [];
  const toDashboard = () => navigate({ name: "dashboard" });

  if (meta && screen.name === "dashboard") {
    crumbs.push({ label: "Projects", onClick: () => void close() });
    crumbs.push({ label: meta.name, onClick: null });
  } else if (meta && (screen.name === "folder" || screen.name === "board")) {
    crumbs.push({ label: meta.name, onClick: toDashboard });
    const id = screen.name === "folder" ? screen.folderId : screen.boardId;
    for (const item of pathOf(id)) {
      crumbs.push({
        label: item.name,
        onClick: () =>
          navigate(
            item.kind === "folder"
              ? { name: "folder", folderId: item.id }
              : { name: "board", boardId: item.id },
          ),
      });
    }
  } else if (meta && ["trash", "projectSettings", "search"].includes(screen.name)) {
    crumbs.push({ label: meta.name, onClick: toDashboard });
    crumbs.push({
      label: { trash: "Trash", projectSettings: "Settings", search: "Search" }[
        screen.name as "trash" | "projectSettings" | "search"
      ],
      onClick: null,
    });
  } else {
    crumbs.push({ label: "Plotr", onClick: () => navigate({ name: "start" }) });
    if (screen.name === "appSettings") crumbs.push({ label: "App settings", onClick: null });
    if (screen.name === "connectors") crumbs.push({ label: "Connectors", onClick: null });
  }

  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <Fragment key={i}>
            {i > 0 && <span className="crumbs__sep">/</span>}
            <button
              className={clsx("crumbs__item", isLast && "crumbs__item--current")}
              onClick={() => !isLast && c.onClick?.()}
              disabled={isLast || !c.onClick}
              title={c.label}
            >
              {c.label}
            </button>
          </Fragment>
        );
      })}
    </nav>
  );
}
