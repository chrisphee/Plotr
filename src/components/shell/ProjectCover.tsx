import { useState } from "react";
import { assetUrl } from "../../tauri/commands";
import { readableTextOn } from "../../lib/color";
import "./shell.css";

interface ProjectCoverProps {
  path: string;
  name: string;
  coverImage?: string | null;
  color?: string | null;
  size?: number;
}

/** A project's app-icon tile: its cover image, or a monogram on its colour. */
export function ProjectCover({ path, name, coverImage, color, size = 28 }: ProjectCoverProps) {
  const [failed, setFailed] = useState(false);
  const tone = color ? readableTextOn(color) : "light";
  const initial = name.trim().charAt(0).toUpperCase() || "P";

  return (
    <span
      className="pcover"
      data-tone={tone}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        fontSize: Math.round(size * 0.46),
        background: color ?? undefined,
      }}
      aria-hidden
    >
      {coverImage && !failed ? (
        <img src={assetUrl(path, coverImage)} alt="" onError={() => setFailed(true)} />
      ) : (
        initial
      )}
    </span>
  );
}
