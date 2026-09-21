#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)

echo "[STEP] incrementally deploy Go backend"
sh "$ROOT_DIR/deploy/backend/local_incremental/start.sh"

echo "[STEP] rebuild React frontend"
sh "$ROOT_DIR/deploy/frontend/local_full/start.sh"

echo "[INFO] ai-file-navigation incremental compose deploy completed"
