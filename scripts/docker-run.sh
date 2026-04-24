#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

MODE="${1:-}"
ACTION="${2:-up}"

case "$MODE" in
  dev)
    FILE="docker-compose-dev.yaml"
    ;;
  prod|production)
    FILE="docker-compose.yaml"
    ;;
  *)
    echo "Usage: $0 <dev|prod> [up|down|restart]"
    exit 1
    ;;
esac

case "$ACTION" in
  up)
    exec docker compose -f "$FILE" up --build
    ;;
  down)
    exec docker compose -f "$FILE" down --remove-orphans
    ;;
  restart)
    docker compose -f "$FILE" down --remove-orphans
    exec docker compose -f "$FILE" up --build
    ;;
  *)
    echo "Invalid action: $ACTION"
    echo "Usage: $0 <dev|prod> [up|down|restart]"
    exit 1
    ;;
esac
