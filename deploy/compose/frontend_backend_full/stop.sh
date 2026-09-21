#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)

sh "$ROOT_DIR/deploy/frontend/local_full/stop.sh" || true
sh "$ROOT_DIR/deploy/backend/local_full/stop.sh" || true

echo "[INFO] ai-file-navigation compose services stopped"
