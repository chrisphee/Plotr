#!/usr/bin/env bash
# Plotr — build and install on Linux (EndeavourOS / Arch).
# Installs the binary to ~/.local/bin and a desktop entry + icon so app
# launchers (GNOME search, KRunner, rofi, …) can find it. No root needed
# except for installing missing system packages via pacman.

set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo"

echo "== Plotr installer =="

# ── System packages (Arch) ──
if command -v pacman >/dev/null 2>&1; then
  pkgs=(webkit2gtk-4.1 gtk3 base-devel openssl librsvg nodejs npm)
  missing=()
  for p in "${pkgs[@]}"; do
    pacman -Qi "$p" >/dev/null 2>&1 || missing+=("$p")
  done
  if [ ${#missing[@]} -gt 0 ]; then
    echo "Installing system packages: ${missing[*]}"
    sudo pacman -S --needed --noconfirm "${missing[@]}"
  fi
fi

# ── Rust ──
if ! command -v cargo >/dev/null 2>&1; then
  echo "Rust not found. Install it with:  sudo pacman -S rustup && rustup default stable"
  exit 1
fi

# ── Build ──
echo "Installing npm dependencies..."
npm install
echo "Building release binary (this can take a few minutes)..."
npm run tauri build -- --no-bundle

bin="$repo/src-tauri/target/release/plotr"
[ -x "$bin" ] || { echo "Build did not produce $bin"; exit 1; }

# ── Install for the current user ──
install -Dm755 "$bin" "$HOME/.local/bin/plotr"
install -Dm644 "$repo/src-tauri/icons/128x128.png" \
  "$HOME/.local/share/icons/hicolor/128x128/apps/plotr.png"
install -Dm644 "$repo/src-tauri/icons/32x32.png" \
  "$HOME/.local/share/icons/hicolor/32x32/apps/plotr.png"

mkdir -p "$HOME/.local/share/applications"
cat > "$HOME/.local/share/applications/plotr.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Plotr
Comment=An offline-first workspace for writers
Exec=$HOME/.local/bin/plotr
Icon=plotr
Terminal=false
Categories=Office;Utility;
StartupWMClass=Plotr
EOF

# Refresh launcher caches (best effort)
command -v update-desktop-database >/dev/null 2>&1 && \
  update-desktop-database "$HOME/.local/share/applications" || true
command -v gtk-update-icon-cache >/dev/null 2>&1 && \
  gtk-update-icon-cache -q "$HOME/.local/share/icons/hicolor" 2>/dev/null || true

echo ""
echo "Plotr installed. Search for 'Plotr' in your app launcher to start it."
echo "(Binary: ~/.local/bin/plotr — make sure ~/.local/bin is on your PATH for terminal use.)"
