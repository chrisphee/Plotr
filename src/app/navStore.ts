import { create } from "zustand";
import { flushSync } from "react-dom";

export type Screen =
  | { name: "start" }
  | { name: "dashboard" }
  | { name: "folder"; folderId: string }
  | { name: "board"; boardId: string }
  | { name: "search"; query: string }
  | { name: "trash" }
  | { name: "projectSettings" }
  | { name: "appSettings" }
  | { name: "connectors" };

interface NavState {
  screen: Screen;
  stack: Screen[];
  navigate: (screen: Screen) => void;
  back: () => void;
  /** Replace everything — used when opening/closing a project. */
  reset: (screen: Screen) => void;
}

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown };

/** Crossfades the content area between screens where the webview supports it. */
function transition(update: () => void) {
  const doc = document as ViewTransitionDocument;
  if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }
  doc.startViewTransition(() => flushSync(update));
}

function sameScreen(a: Screen, b: Screen) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const useNav = create<NavState>((set, get) => ({
  screen: { name: "start" },
  stack: [],
  navigate: (screen) => {
    if (sameScreen(screen, get().screen)) return;
    transition(() => set((s) => ({ screen, stack: [...s.stack.slice(-19), s.screen] })));
  },
  back: () =>
    transition(() =>
      set((s) => {
        const prev = s.stack[s.stack.length - 1];
        if (!prev) return s;
        return { screen: prev, stack: s.stack.slice(0, -1) };
      }),
    ),
  reset: (screen) => transition(() => set({ screen, stack: [] })),
}));
