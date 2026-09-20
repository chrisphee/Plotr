import clsx from "clsx";
import { CATEGORY_PRESETS } from "../../lib/schema";
import "./categories.css";

/* Preset swatches (the Quill category colours) + a custom colour input. */

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="swatches">
      {CATEGORY_PRESETS.map((p) => (
        <button
          key={p.color}
          className={clsx("swatch", value === p.color && "swatch--active")}
          style={{ background: p.color }}
          title={p.name}
          onClick={() => onChange(p.color)}
        />
      ))}
      <span className={clsx("swatch", "swatch--custom")} title="Custom colour">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#7c5cbf"}
          onChange={(e) => onChange(e.target.value)}
        />
      </span>
    </div>
  );
}
