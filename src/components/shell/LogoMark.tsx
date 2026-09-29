import { useId } from "react";

/* The Plotr "Iso stack" mark (docs/design/ui-redesign-1/logo/plotr-mark.svg).
   Gaps between sheets are cut with masks, so it sits on any background. */

const SHEETS = [
  "50,51 80,66 50,81 20,66",
  "50,39 80,54 50,69 20,54",
  "50,27 80,42 50,57 20,42",
  "50,15 80,30 50,45 20,30",
];

export function LogoMark({ className = "logomark" }: { className?: string }) {
  const id = "logo" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg className={className} viewBox="18 13 64 70" aria-hidden>
      <defs>
        {SHEETS.slice(1).map((above, i) => (
          <mask key={i} id={`${id}m${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
            <rect width="100" height="100" fill="#fff" />
            <polygon points={above} fill="#000" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
          </mask>
        ))}
      </defs>
      {SHEETS.slice(0, 3).map((points, i) => (
        <polygon key={i} points={points} fill="var(--ink)" mask={`url(#${id}m${i})`} />
      ))}
      <polygon points={SHEETS[3]} fill="var(--accent)" />
    </svg>
  );
}
