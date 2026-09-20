import { Fragment } from "react";
import clsx from "clsx";
import { useNav, type Screen } from "../../app/navStore";
import { useProject } from "../../stores/projectStore";
import "./shell.css";

interface Crumb {
  label: string;
  screen: Screen | null; // null = current, not clickable
}

/** "Projects > The Silent Kingdom > Worldbuilding > Characters" */
export function Breadcrumb() {
  const screen = useNav((s) => s.screen);
  const navigate = useNav((s) => s.navigate);
  const meta = useProject((s) => s.meta);
  const pathOf = useProject((s) => s.pathOf);

  const crumbs: Crumb[] = [{ label: "Projects", screen: { name: "start" } }];

  if (meta) {
    crumbs.push({ label: meta.name, screen: { name: "dashboard" } });

    if (screen.name === "folder" || screen.name === "board") {
      const id = screen.name === "folder" ? screen.folderId : screen.boardId;
      for (const item of pathOf(id)) {
        crumbs.push({
          label: item.name,
          screen:
            item.kind === "folder"
              ? { name: "folder", folderId: item.id }
              : { name: "board", boardId: item.id },
        });
      }
    } else if (screen.name === "trash") {
      crumbs.push({ label: "Trash", screen: null });
    } else if (screen.name === "projectSettings") {
      crumbs.push({ label: "Settings", screen: null });
    } else if (screen.name === "search") {
      crumbs.push({ label: "Search", screen: null });
    }
  }
  if (screen.name === "appSettings") {
    crumbs.push({ label: "App Settings", screen: null });
  }

  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <Fragment key={i}>
            {i > 0 && <span className="crumbs__sep">›</span>}
            <button
              className={clsx("crumbs__item", isLast && "crumbs__item--current")}
              onClick={() => !isLast && c.screen && navigate(c.screen)}
              disabled={isLast || !c.screen}
            >
              {c.label}
            </button>
          </Fragment>
        );
      })}
    </nav>
  );
}
