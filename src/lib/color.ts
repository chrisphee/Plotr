/* Tiny colour utilities for user-picked colours. */

/** Parse #rgb/#rrggbb to [r,g,b] 0..255, or null for anything else. */
function parseHex(color: string): [number, number, number] | null {
  const m3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(color);
  if (m3) return [parseInt(m3[1] + m3[1], 16), parseInt(m3[2] + m3[2], 16), parseInt(m3[3] + m3[3], 16)];
  const m6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  if (m6) return [parseInt(m6[1], 16), parseInt(m6[2], 16), parseInt(m6[3], 16)];
  return null;
}

/** Readable text colour on top of an arbitrary background colour. */
export function readableTextOn(background: string): "light" | "dark" {
  const rgb = parseHex(background);
  if (!rgb) return "light"; // non-hex (oklch presets are all mid/dark) → light text
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? "dark" : "light";
}
