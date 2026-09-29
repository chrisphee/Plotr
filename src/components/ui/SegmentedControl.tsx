import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import clsx from "clsx";
import "./ui.css";

interface Segment<T extends string> {
  value: T;
  label: ReactNode;
  count?: number;
  /** Accessible name when the label is an icon. */
  title?: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  label?: string;
}

/** Apple-style segmented control; the white thumb slides to the chosen segment. */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  className,
  label,
}: SegmentedControlProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const measure = () => {
      const el = root.querySelector<HTMLElement>('[aria-checked="true"]');
      if (el) setThumb({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    const t = requestAnimationFrame(() => setReady(true));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(t);
    };
  }, [value, segments.length]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = segments.findIndex((s) => s.value === value);
    const next = segments[(i + (e.key === "ArrowRight" ? 1 : -1) + segments.length) % segments.length];
    onChange(next.value);
    requestAnimationFrame(() =>
      ref.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus(),
    );
  };

  return (
    <div
      ref={ref}
      className={clsx("seg", ready && "seg--ready", className)}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {thumb && (
        <span className="seg__thumb" style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }} aria-hidden />
      )}
      {segments.map((s) => {
        const on = s.value === value;
        return (
          <button
            key={s.value}
            role="radio"
            aria-checked={on}
            aria-label={s.title}
            title={s.title}
            tabIndex={on ? 0 : -1}
            className={clsx("seg__item", on && "seg__item--on")}
            onClick={() => onChange(s.value)}
          >
            {s.label}
            {s.count !== undefined && <span className="seg__count">{s.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
