import clsx from "clsx";
import "./ui.css";

interface Segment<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  label?: string;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  className,
  label,
}: SegmentedControlProps<T>) {
  return (
    <div className={clsx("seg", className)} role="radiogroup" aria-label={label}>
      {segments.map((s) => (
        <button
          key={s.value}
          role="radio"
          aria-checked={s.value === value}
          className={clsx("seg__item", s.value === value && "seg__item--on")}
          onClick={() => onChange(s.value)}
        >
          {s.label}
          {s.count !== undefined && <span className="seg__count">{s.count}</span>}
        </button>
      ))}
    </div>
  );
}
