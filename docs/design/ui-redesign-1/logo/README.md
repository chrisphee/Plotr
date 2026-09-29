# Plotr logo: mark 4a "Iso stack"

Four flat sheets in isometric view, stacked. The top sheet is pine teal. Colours: black #06070E, white #FFFFFF, teal #29524A (and #5E9A8C for the top sheet on dark backgrounds).

## Files
| File | Use |
|---|---|
| `plotr-icon.svg` | **Master app icon.** A white rounded tile with a 1-unit #E4E4E6 hairline. The source for every OS icon. |
| `plotr-icon-1024.png` | The master rendered at 1024×1024, for tools that need a PNG. |
| `plotr-icon-dark.svg` / `-dark-1024.png` | Black tile with white sheets. Optional, for a dark or alt icon. |
| `plotr-mark.svg` | The mark only, with a transparent background. For in-app use on light surfaces (TopBar logo, empty states, About). |
| `plotr-mark-on-dark.svg` | The mark only, for dark surfaces (the dark theme). |

The gaps between sheets are **cut with SVG masks**, not painted white. The transparent marks therefore work on any background.

## Geometry (viewBox 0 0 100 100)
- **Tile:** 100×100, corner radius 23.
- **Sheets:** diamonds with half-width 30 and half-height 15 (a 2:1 isometric angle), centred at x = 50. From bottom to top, their centres are at y = 66, 54, 42, 30, a 12-unit step.
  - `50,51 80,66 50,81 20,66` (black)
  - `50,39 80,54 50,69 20,54` (black)
  - `50,27 80,42 50,57 20,42` (black)
  - `50,15 80,30 50,45 20,30` (teal)
- **Gap:** each sheet is cut by the outline of the sheet above it, a 5-unit round-join stroke, so the visible gap is about 2.5 units.

## Generating app icons (Tauri 2)
From the repo root:
```sh
npx tauri icon path/to/plotr_logo/plotr-icon-1024.png
```
This regenerates everything in `src-tauri/icons/`: the 32/64/128/128@2x PNGs, the Square*Logo files, StoreLogo, icon.ico, icon.png, and the android and ios sets. Replace `src-tauri/icons/icon.svg` with `plotr-icon.svg`.

## Small sizes
- Legible down to 16px without changes.
- For favicon or tray icons at 16px or below, you can drop the hairline and use the dark tile if the tray background is light grey.

## In-app placement
- **TopBar logo:** replace the 22px black tile with the teal dot (see the handoff README, "Global: TopBar"). Use `plotr-mark.svg` at 22px height, or `plotr-icon.svg` at 22×22 for the tile look.
- **Dark theme:** use `plotr-mark-on-dark.svg`.
