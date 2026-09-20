#!/usr/bin/env bash
# Plotr — self-update on Linux. Launched by the in-app Update button.
# Runs headless (the app has closed), logging to ~/.cache/plotr-update.log,
# then relaunches Plotr and sends a desktop notification.

repo="$(cd "$(dirname "$0")/.." && pwd)"
log="$HOME/.cache/plotr-update.log"
mkdir -p "$HOME/.cache"
exec >"$log" 2>&1

set -uo pipefail
cd "$repo"
echo "== Plotr updater == $(date)"

notify() {
  command -v notify-send >/dev/null 2>&1 && notify-send "Plotr" "$1" || true
}

# ── Wait for the app to close ──
for _ in $(seq 1 60); do
  pgrep -x plotr >/dev/null 2>&1 || break
  sleep 0.5
done
if pgrep -x plotr >/dev/null 2>&1; then
  echo "Plotr is still running; aborting update."
  notify "Update aborted — Plotr is still running. See ~/.cache/plotr-update.log"
  exit 1
fi

# ── Pull the latest changes ──
if [ -d "$repo/.git" ] && command -v git >/dev/null 2>&1 && git remote get-url origin >/dev/null 2>&1; then
  echo "Pulling latest changes..."
  if ! git pull --ff-only; then
    echo "git pull failed — continuing with the current code."
  fi
else
  echo "No git repo/remote — skipping pull, reinstalling current code."
fi

# ── Rebuild and reinstall ──
if ! bash "$repo/scripts/install.sh"; then
  echo "Install failed."
  notify "Plotr update failed — see ~/.cache/plotr-update.log"
  exit 1
fi

# ── Relaunch ──
if [ -x "$HOME/.local/bin/plotr" ]; then
  nohup "$HOME/.local/bin/plotr" >/dev/null 2>&1 &
  disown || true
fi

echo "Update complete."
notify "Plotr updated and relaunched."
