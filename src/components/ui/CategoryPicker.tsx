import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { useProject } from "../../stores/projectStore";
import { CategoryDot } from "./CategoryChip";
import type { MenuPosition } from "./Menu";
import "./categories.css";

/* Multi-select popover of project categories. Stays open across toggles. */

interface CategoryPickerProps {
  position: MenuPosition;
  selectedIds: string[];
  onToggle: (categoryId: string) => void;
  onClose: () => void;
}

export function CategoryPicker({ position, selectedIds, onToggle, onClose }: CategoryPickerProps) {
  const categories = useProject((s) => s.meta?.categories ?? []);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      className="catpicker"
      style={{
        left: Math.min(position.x, window.innerWidth - 220),
        top: Math.min(position.y, window.innerHeight - 40 * categories.length - 24),
      }}
    >
      {categories.length === 0 && (
        <div className="wikilink-menu__empty">No categories yet — add them in Project Settings.</div>
      )}
      {categories.map((c) => (
        <button key={c.id} className="catpicker__row" onClick={() => onToggle(c.id)}>
          <CategoryDot color={c.color} />
          {c.name}
          {selectedIds.includes(c.id) && <Check size={14} className="catpicker__check" />}
        </button>
      ))}
    </div>,
    document.body,
  );
}
