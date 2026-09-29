import clsx from "clsx";
import { readableTextOn } from "../../lib/color";
import "./categories.css";

/* Preset swatches plus a custom colour input. */

interface ColorPickerProps {
  value: string;
  presets: { name: string; color: string }[];
  onChange: (color: string) => void;
}

export function ColorPicker({ value, presets, onChange }: ColorPickerProps) {
  const isPreset = presets.some((p) => p.color.toLowerCase() === value.toLowerCase());
  return (
    <div className="swatches">
      {presets.map((p) => (
        <button
          key={p.color}
          className={clsx(
            "swatch",
            readableTextOn(p.color) === "dark" && "swatch--light",
            value.toLowerCase() === p.color.toLowerCase() && "swatch--active",
          )}
          style={{ background: p.color }}
          title={p.name}
          aria-label={p.name}
          onClick={() => onChange(p.color)}
        />
      ))}
      <span
        className={clsx("swatch", "swatch--custom", value && !isPreset && "swatch--active")}
        title="Custom colour"
      >
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#29524a"}
          onChange={(e) => onChange(e.target.value)}
        />
      </span>
    </div>
  );
}
