/* Human dates for rows and meta lines. */

const DAY = 86_400_000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayMonth(d: Date, now: Date, withYear = false): string {
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return withYear || d.getFullYear() !== now.getFullYear() ? `${base} ${d.getFullYear()}` : base;
}

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Compact form: "2h ago" (or "14:02" with `todayAsTime`), "Yesterday",
 * "Mon", "12 Sep", "12 Sep 2025".
 */
export function shortDate(iso: string | null | undefined, todayAsTime = false): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const days = Math.round((startOfDay(now) - startOfDay(d)) / DAY);
  if (days <= 0) {
    if (todayAsTime) return hhmm(d);
    const mins = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 60_000));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return WEEKDAYS[d.getDay()];
  return dayMonth(d, now);
}

/** Sentence form for meta lines: "2 hours ago", "yesterday", "on 12 Sep". */
export function agoLong(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const mins = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 60_000));
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;
  if (mins < 1) return "just now";
  if (mins < 60) return plural(mins, "minute");
  const days = Math.round((startOfDay(now) - startOfDay(d)) / DAY);
  if (days <= 0) return plural(Math.floor(mins / 60), "hour");
  if (days === 1) return "yesterday";
  if (days < 7) return plural(days, "day");
  return `on ${dayMonth(d, now)}`;
}

/** Long form for the note footer: "3 Sep 2026" or "28 Sep 2026, 14:02". */
export function longDate(iso: string, withTime = false): string {
  const d = new Date(iso);
  const date = dayMonth(d, new Date(), true);
  return withTime ? `${date}, ${hhmm(d)}` : date;
}
