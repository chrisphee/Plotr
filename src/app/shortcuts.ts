import { useEffect } from "react";
import { useSearch } from "../features/search/searchStore";
import { useProject } from "../stores/projectStore";
import { saveQueue } from "../lib/saveQueue";

/* One window-level listener for app-global shortcuts. Editor-local combos
   (Ctrl+B/I/Z…) are handled by TipTap and never reach here with a claim. */

export function useGlobalShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === "f") {
        if (useProject.getState().projectPath) {
          e.preventDefault();
          useSearch.getState().setOverlayOpen(true);
        }
      } else if (mod && !e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveQueue.flush();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
