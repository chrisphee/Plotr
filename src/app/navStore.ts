import { create } from "zustand";

export type Screen =
  | { name: "start" }
  | { name: "dashboard" }
  | { name: "folder"; folderId: string }
  | { name: "board"; boardId: string }
  | { name: "search"; query: string }
  | { name: "trash" }
  | { name: "projectSettings" }
  | { name: "appSettings" };

interface NavState {
  screen: Screen;
  stack: Screen[];
  navigate: (screen: Screen) => void;
  back: () => void;
  /** Replace everything — used when opening/closing a project. */
  reset: (screen: Screen) => void;
}

export const useNav = create<NavState>((set) => ({
  screen: { name: "start" },
  stack: [],
  navigate: (screen) =>
    set((s) => ({ screen, stack: [...s.stack.slice(-19), s.screen] })),
  back: () =>
    set((s) => {
      const prev = s.stack[s.stack.length - 1];
      if (!prev) return s;
      return { screen: prev, stack: s.stack.slice(0, -1) };
    }),
  reset: (screen) => set({ screen, stack: [] }),
}));
