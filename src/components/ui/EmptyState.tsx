import { type ReactNode } from "react";
import "./ui.css";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="empty">
      {icon}
      <div className="empty__title">{title}</div>
      {message && <p className="meta">{message}</p>}
      {action}
    </div>
  );
}
