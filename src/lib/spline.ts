/* Monotone cubic interpolation (Fritsch–Carlson) for points sorted by x.
   The curve passes through every point and never overshoots between them. */

export interface Pt {
  x: number;
  y: number;
}

function tangents(p: Pt[]): number[] {
  const n = p.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = p[i + 1].x - p[i].x;
    d.push(dx === 0 ? 0 : (p[i + 1].y - p[i].y) / dx);
  }
  const m = new Array<number>(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return m;
}

/** SVG path data through `p`. */
export function monotonePath(p: Pt[]): string {
  if (p.length === 0) return "";
  if (p.length === 1) return `M${p[0].x},${p[0].y}`;
  const m = tangents(p);
  let s = `M${p[0].x},${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const dx = (p[i + 1].x - p[i].x) / 3;
    s += ` C${p[i].x + dx},${p[i].y + m[i] * dx} ${p[i + 1].x - dx},${p[i + 1].y - m[i + 1] * dx} ${p[i + 1].x},${p[i + 1].y}`;
  }
  return s;
}

/** Points along the curve, `steps` per segment, for hit tests. */
export function sampleMonotone(p: Pt[], steps = 12): Pt[] {
  if (p.length < 2) return [...p];
  const m = tangents(p);
  const out: Pt[] = [];
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i];
    const b = p[i + 1];
    const h = b.x - a.x;
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: a.x + h * t,
        y:
          (2 * t3 - 3 * t2 + 1) * a.y +
          (t3 - 2 * t2 + t) * h * m[i] +
          (-2 * t3 + 3 * t2) * b.y +
          (t3 - t2) * h * m[i + 1],
      });
    }
  }
  out.push(p[p.length - 1]);
  return out;
}
