export type ThemePref = "light" | "dark" | "system";
export type AccentPref = "pine" | "blue" | "violet" | "rose" | "orange" | "graphite";

export const ACCENTS: { value: AccentPref; label: string; swatch: string }[] = [
  { value: "pine", label: "Pine", swatch: "#227A66" },
  { value: "blue", label: "Blue", swatch: "#0066D6" },
  { value: "violet", label: "Violet", swatch: "#6A4BD8" },
  { value: "rose", label: "Rose", swatch: "#C8365E" },
  { value: "orange", label: "Orange", swatch: "#B4570F" },
  { value: "graphite", label: "Graphite", swatch: "#4B4B52" },
];

const media = window.matchMedia("(prefers-color-scheme: dark)");
let current: ThemePref = "system";

function apply() {
  const dark = current === "dark" || (current === "system" && media.matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

media.addEventListener("change", apply);

export function setTheme(pref: ThemePref) {
  current = pref;
  apply();
}

export function setAccent(accent: AccentPref) {
  document.documentElement.dataset.accent = accent;
}
