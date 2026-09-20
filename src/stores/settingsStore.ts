import { create } from "zustand";
import { LazyStore } from "@tauri-apps/plugin-store";
import { setTheme, type ThemePref } from "../app/theme";
import { saveQueue } from "../lib/saveQueue";

const store = new LazyStore("settings.json");

export interface RecentProject {
  path: string;
  name: string;
  openedAt: string;
  /** Snapshot of the project's card appearance, refreshed on open/edit. */
  coverImage?: string | null;
  color?: string | null;
}

interface SettingsState {
  loaded: boolean;
  theme: ThemePref;
  autosave: boolean;
  defaultProjectDir: string | null;
  recents: RecentProject[];
  init: () => Promise<void>;
  setThemePref: (t: ThemePref) => void;
  setAutosave: (v: boolean) => void;
  setDefaultProjectDir: (dir: string | null) => void;
  touchRecent: (
    path: string,
    name: string,
    appearance?: { coverImage: string | null; color: string | null },
  ) => void;
  removeRecent: (path: string) => void;
}

function persist(state: SettingsState) {
  void store.set("theme", state.theme);
  void store.set("autosave", state.autosave);
  void store.set("defaultProjectDir", state.defaultProjectDir);
  void store.set("recents", state.recents);
  void store.save();
}

export const useSettings = create<SettingsState>((set, get) => ({
  loaded: false,
  theme: "system",
  autosave: true,
  defaultProjectDir: null,
  recents: [],

  init: async () => {
    const [theme, autosave, defaultProjectDir, recents] = await Promise.all([
      store.get<ThemePref>("theme"),
      store.get<boolean>("autosave"),
      store.get<string | null>("defaultProjectDir"),
      store.get<RecentProject[]>("recents"),
    ]);
    const t = theme ?? "system";
    setTheme(t);
    saveQueue.setAutosave(autosave ?? true);
    set({
      loaded: true,
      theme: t,
      autosave: autosave ?? true,
      defaultProjectDir: defaultProjectDir ?? null,
      recents: recents ?? [],
    });
  },

  setThemePref: (t) => {
    setTheme(t);
    set({ theme: t });
    persist(get());
  },

  setAutosave: (v) => {
    saveQueue.setAutosave(v);
    set({ autosave: v });
    persist(get());
  },

  setDefaultProjectDir: (dir) => {
    set({ defaultProjectDir: dir });
    persist(get());
  },

  touchRecent: (path, name, appearance) => {
    const prev = get().recents.find((r) => r.path === path);
    const rest = get().recents.filter((r) => r.path !== path);
    set({
      recents: [
        {
          path,
          name,
          openedAt: new Date().toISOString(),
          coverImage: appearance ? appearance.coverImage : prev?.coverImage ?? null,
          color: appearance ? appearance.color : prev?.color ?? null,
        },
        ...rest,
      ].slice(0, 12),
    });
    persist(get());
  },

  removeRecent: (path) => {
    set({ recents: get().recents.filter((r) => r.path !== path) });
    persist(get());
  },
}));
