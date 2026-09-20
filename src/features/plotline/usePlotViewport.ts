import { useCallback, useRef, useState } from "react";

/* 1-D camera for the Plot Line.

   The story always spans at least the full window: at zoom 1, Beginning sits
   at the left edge and Ending at the right edge (inside PAD_X gutters).
   Zooming in grows the scale — gaps between nearby dots widen — and panning
   is clamped so the view can never move past Beginning or Ending.

   screenX = PAD_X + x * usable * zoom - panX
   zoom ∈ [1, 8] · panX ∈ [0, usable * (zoom - 1)]                        */

export const PAD_X = 56;
const MAX_ZOOM = 8;

export interface PlotViewport {
  zoom: number;
  panX: number;
}

export function usePlotViewport(initial: PlotViewport) {
  const widthRef = useRef(1200);
  const usable = () => Math.max(widthRef.current - 2 * PAD_X, 100);

  const clampVp = useCallback((v: PlotViewport): PlotViewport => {
    const zoom = Math.min(MAX_ZOOM, Math.max(1, v.zoom));
    const panX = Math.min(usable() * (zoom - 1), Math.max(0, v.panX));
    return { zoom, panX };
  }, []);

  const [vp, setVpRaw] = useState<PlotViewport>(() =>
    clampVp({ zoom: initial.zoom ?? 1, panX: initial.panX ?? 0 }),
  );
  const vpRef = useRef(vp);
  vpRef.current = vp;

  const setVp = useCallback(
    (update: PlotViewport | ((v: PlotViewport) => PlotViewport)) => {
      setVpRaw((v) => clampVp(typeof update === "function" ? update(v) : update));
    },
    [clampVp],
  );

  /** The screen keeps this in sync with the canvas width. */
  const setWidth = useCallback((w: number) => {
    widthRef.current = Math.max(w, 200);
  }, []);

  const toScreenX = useCallback(
    (x: number) => PAD_X + x * usable() * vpRef.current.zoom - vpRef.current.panX,
    [],
  );
  const toWorldX = useCallback(
    (screenX: number) =>
      (screenX - PAD_X + vpRef.current.panX) / (usable() * vpRef.current.zoom),
    [],
  );

  /** Zoom keeping the world point under `anchorScreenX` stationary. */
  const zoomAt = useCallback(
    (anchorScreenX: number, factor: number) => {
      setVp((v) => {
        const zoom = Math.min(MAX_ZOOM, Math.max(1, v.zoom * factor));
        const worldX = (anchorScreenX - PAD_X + v.panX) / (usable() * v.zoom);
        return { zoom, panX: PAD_X + worldX * usable() * zoom - anchorScreenX };
      });
    },
    [setVp],
  );

  const panBy = useCallback(
    (dx: number) => {
      setVp((v) => ({ ...v, panX: v.panX + dx }));
    },
    [setVp],
  );

  /** Zoom in on the x-range of the given points (never below full-story). */
  const fitToView = useCallback(
    (xs: number[]) => {
      const min = xs.length ? Math.min(...xs) : 0;
      const max = xs.length ? Math.max(...xs) : 1;
      const span = Math.max(0.1, max - min);
      const pad = 0.06;
      const zoom = 1 / Math.min(1, span + pad * 2);
      setVp({ zoom, panX: (min - pad) * usable() * zoom });
    },
    [setVp],
  );

  return { vp, setVp, clampVp, setWidth, toScreenX, toWorldX, zoomAt, panBy, fitToView };
}
