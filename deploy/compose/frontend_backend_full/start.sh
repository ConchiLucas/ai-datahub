#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)

echo "[STEP] start Go backend"
sh "$ROOT_DIR/deploy/backend/local_full/start.sh"

echo "[STEP] start React frontend"
sh "$ROOT_DIR/deploy/frontend/local_full/start.sh"

echo "[INFO] ai-file-navigation full compose deploy completed"
