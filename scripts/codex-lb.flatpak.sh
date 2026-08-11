#!/usr/bin/env bash
# Run codex-lb from inside the Mattermost Flatpak sandbox.
#
# Layout (host files/ → sandbox /app/):
#   files/bin/codex-lb
#   files/bin/codex-lb-db
#   files/bin/vendor/
#   files/bin/codex-lb.flatpak.sh   # this script
#
# Start:
#   flatpak run --command=codex-lb.flatpak.sh com.mattermost.Desktop
#   # or absolute:
#   flatpak run --command=/app/bin/codex-lb.flatpak.sh com.mattermost.Desktop
#
set -euo pipefail

# Fixed: our bundle lives in /app/bin (Flatpak files/bin).
CODEX_LB_ROOT="/app"
LAUNCHER="${CODEX_LB_ROOT}/bin/codex-lb"

# Persist under this Flatpak app's .var config tree:
#   ~/.var/app/com.mattermost.Desktop/config/codex-lb
_FLATPAK_CONFIG_HOME="${XDG_CONFIG_HOME:-${HOME}/.config}"
CODEX_LB_DATA_DIR="${CODEX_LB_DATA_DIR:-${_FLATPAK_CONFIG_HOME}/codex-lb}"

# Dashboard listen (OAuth callback stays on localhost:1455 — not these).
CODEX_LB_HOST="${CODEX_LB_HOST:-127.0.0.1}"
CODEX_LB_PORT="${CODEX_LB_PORT:-2455}"

export CODEX_LB_DATA_DIR
mkdir -p "$CODEX_LB_DATA_DIR"

if [[ ! -x "$LAUNCHER" ]]; then
  echo "codex-lb not found or not executable: $LAUNCHER" >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found inside this Flatpak (need Python 3.13)." >&2
  exit 1
fi

py_ver="$(python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])')"
if [[ "$py_ver" != "3.13" ]]; then
  echo "warning: python3 is $py_ver; vendored wheels expect 3.13." >&2
fi

echo "CODEX_LB_DATA_DIR=$CODEX_LB_DATA_DIR"
echo "launcher=$LAUNCHER"
echo "python=$(command -v python3) ($py_ver)"

if [[ "${1:-}" == "--" ]]; then
  shift
fi

exec "$LAUNCHER" --host "$CODEX_LB_HOST" --port "$CODEX_LB_PORT" "$@"
