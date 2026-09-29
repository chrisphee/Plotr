import { type ReactNode } from "react";
import "./ui.css";

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="empty__title">{title}</div>
      {message && <p className="meta">{message}</p>}
      {action}
    </div>
  );
}
