import { type ReactNode } from "react";
import clsx from "clsx";
import "./ui.css";

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, message, icon, action, className }: EmptyStateProps) {
  return (
    <div className={clsx("empty", className)}>
      {icon && <div className="empty__icon">{icon}</div>}
      <div className="empty__title">{title}</div>
      {message && <p className="empty__message">{message}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}
