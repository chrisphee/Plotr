import { create } from "zustand";

const KEY = "plotr.sidebar";

interface Saved {
  collapsed: boolean;
  expanded: string[];
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<Saved>;
      return { collapsed: Boolean(v.collapsed), expanded: Array.isArray(v.expanded) ? v.expanded : [] };
    }
  } catch {
    /* per-viewer convenience only */
  }
  return { collapsed: false, expanded: [] };
}

function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* per-viewer convenience only */
  }
}

interface SidebarState {
  collapsed: boolean;
  expanded: Set<string>;
  toggleCollapsed: () => void;
  toggleFolder: (id: string) => void;
  expand: (ids: string[]) => void;
}

const initial = load();

export const useSidebar = create<SidebarState>((set, get) => {
  const persist = () => save({ collapsed: get().collapsed, expanded: [...get().expanded] });
  return {
    collapsed: initial.collapsed,
    expanded: new Set(initial.expanded),
    toggleCollapsed: () => {
      set({ collapsed: !get().collapsed });
      persist();
    },
    toggleFolder: (id) => {
      const next = new Set(get().expanded);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      set({ expanded: next });
      persist();
    },
    expand: (ids) => {
      const cur = get().expanded;
      if (ids.every((id) => cur.has(id))) return;
      set({ expanded: new Set([...cur, ...ids]) });
      persist();
    },
  };
});
