import { useEffect, useRef } from "react";
import { useSearch } from "../features/search/searchStore";
import { saveQueue } from "../lib/saveQueue";
import { useSidebar } from "../components/shell/sidebarStore";

/* One window-level listener for app-global shortcuts. Editor-local combos
   (Ctrl+B/I/Z…) are handled by TipTap and never reach here with a claim. */

export function useGlobalShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && ((!e.shiftKey && key === "k") || (e.shiftKey && key === "f"))) {
        e.preventDefault();
        useSearch.getState().setOverlayOpen(true);
      } else if (mod && !e.shiftKey && key === "s") {
        e.preventDefault();
        void saveQueue.flush();
      } else if (mod && e.key === "\\") {
        e.preventDefault();
        useSidebar.getState().toggleCollapsed();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  const h = el as HTMLElement;
  return h.tagName === "INPUT" || h.tagName === "TEXTAREA" || h.tagName === "SELECT" || h.isContentEditable;
}

/** True while a dialog, popup or menu owns the keyboard. */
export function isOverlayOpen(): boolean {
  return document.querySelector('[role="dialog"], [role="menu"]') !== null;
}

/** A bare-key shortcut (like `N`) that stays quiet while typing or in a dialog. */
export function useKeyShortcut(key: string | null, handler: () => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!key) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (isTypingTarget(document.activeElement) || isOverlayOpen()) return;
      e.preventDefault();
      ref.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key]);
}
