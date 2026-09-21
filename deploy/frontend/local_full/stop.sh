#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

docker compose \
  -p ai-file-navigation-web \
  -f "$SCRIPT_DIR/docker-compose.yml" \
  down
