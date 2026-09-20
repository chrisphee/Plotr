import type { Category } from "../../lib/schema";
import "./categories.css";

export function CategoryChip({ category }: { category: Category }) {
  return (
    <span className="catchip" style={{ "--chip-color": category.color } as React.CSSProperties}>
      <span className="catchip__dot" />
      {category.name}
    </span>
  );
}

export function CategoryDot({ color, title }: { color: string; title?: string }) {
  return (
    <span
      className="catdot"
      title={title}
      style={{ "--chip-color": color } as React.CSSProperties}
    />
  );
}
