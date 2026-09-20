import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import "./ui.css";

/* Lightweight context/dropdown menu. Open it at a screen position (context
   menu) or anchored under an element (dropdown). */

export interface MenuPosition {
  x: number;
  y: number;
}

interface MenuProps {
  position: MenuPosition;
  onClose: () => void;
  children: ReactNode;
}

const MenuCloseContext = createContext<() => void>(() => {});

export function Menu({ position, onClose, children }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(position);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: Math.min(position.x, window.innerWidth - r.width - 8),
      y: Math.min(position.y, window.innerHeight - r.height - 8),
    });
  }, [position]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  return createPortal(
    <div ref={ref} className="menu" style={{ left: pos.x, top: pos.y }} role="menu">
      <MenuCloseContext.Provider value={onClose}>{children}</MenuCloseContext.Provider>
    </div>,
    document.body,
  );
}

interface MenuItemProps {
  icon?: ReactNode;
  danger?: boolean;
  onSelect: () => void;
  children: ReactNode;
}

export function MenuItem({ icon, danger, onSelect, children }: MenuItemProps) {
  const close = useContext(MenuCloseContext);
  return (
    <button
      className={clsx("menu__item", danger && "menu__item--danger")}
      role="menuitem"
      onClick={() => {
        close();
        onSelect();
      }}
    >
      {icon}
      {children}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="menu__sep" />;
}
