export type ThemePref = "light" | "dark" | "system";

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
