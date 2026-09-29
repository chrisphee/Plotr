import { create } from "zustand";
import { LazyStore } from "@tauri-apps/plugin-store";
import { documentDir, join } from "@tauri-apps/api/path";
import { setAccent, setTheme, type AccentPref, type ThemePref } from "../app/theme";
import { saveQueue } from "../lib/saveQueue";

const store = new LazyStore("settings.json");

export interface RecentProject {
  path: string;
  name: string;
  openedAt: string;
  /** Snapshot of the project's card appearance, refreshed on open/edit. */
  coverImage?: string | null;
  color?: string | null;
  description?: string;
}

interface SettingsState {
  loaded: boolean;
  theme: ThemePref;
  accent: AccentPref;
  autosave: boolean;
  defaultProjectDir: string | null;
  recents: RecentProject[];
  init: () => Promise<void>;
  setThemePref: (t: ThemePref) => void;
  setAccentPref: (a: AccentPref) => void;
  setAutosave: (v: boolean) => void;
  setDefaultProjectDir: (dir: string | null) => void;
  touchRecent: (
    path: string,
    name: string,
    appearance?: { coverImage: string | null; color: string | null; description: string },
  ) => void;
  removeRecent: (path: string) => void;
}

function persist(state: SettingsState) {
  void store.set("theme", state.theme);
  void store.set("accent", state.accent);
  void store.set("autosave", state.autosave);
  void store.set("defaultProjectDir", state.defaultProjectDir);
  void store.set("recents", state.recents);
  void store.save();
}

export const useSettings = create<SettingsState>((set, get) => ({
  loaded: false,
  theme: "system",
  accent: "pine",
  autosave: true,
  defaultProjectDir: null,
  recents: [],

  init: async () => {
    const [theme, accent, autosave, defaultProjectDir, recents] = await Promise.all([
      store.get<ThemePref>("theme"),
      store.get<AccentPref>("accent"),
      store.get<boolean>("autosave"),
      store.get<string | null>("defaultProjectDir"),
      store.get<RecentProject[]>("recents"),
    ]);
    const t = theme ?? "system";
    setTheme(t);
    setAccent(accent ?? "pine");
    saveQueue.setAutosave(autosave ?? true);
    set({
      loaded: true,
      theme: t,
      accent: accent ?? "pine",
      autosave: autosave ?? true,
      defaultProjectDir: defaultProjectDir ?? (await join(await documentDir(), "Plotr")),
      recents: recents ?? [],
    });
  },

  setThemePref: (t) => {
    setTheme(t);
    set({ theme: t });
    persist(get());
  },

  setAccentPref: (a) => {
    setAccent(a);
    set({ accent: a });
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
          description: appearance ? appearance.description : prev?.description ?? "",
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
