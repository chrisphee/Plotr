import { type ReactNode } from "react";
import clsx from "clsx";
import { Breadcrumb } from "./Breadcrumb";
import "./shell.css";

interface DockProps {
  /** Board- or screen-specific actions, rendered on the right. */
  actions?: ReactNode;
  /** Centre over the content area instead of the window (spine visible). */
  withSpine?: boolean;
}

/** The one persistent surface: breadcrumb left, contextual actions right. */
export function Dock({ actions, withSpine }: DockProps) {
  return (
    <div className={clsx("dock", withSpine && "dock--spine")}>
      <Breadcrumb />
      {actions && (
        <>
          <div className="dock__sep" />
          <div className="dock__actions">{actions}</div>
        </>
      )}
    </div>
  );
}
