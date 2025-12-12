#!/usr/bin/env bash
set -euo pipefail

# Runs backend builds plus frontend lint/build to mirror CI. Handy locally as well.
# Set RUN_INSTALL=false to skip npm ci when dependencies already exist.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
FRONTEND_DIR="$REPO_ROOT/hotel-booking-frontend"
BACKEND_SERVICES=(
  "api-gateway"
  "identity-service"
  "hotel-service"
  "booking-service"
  "search-service"
  "notification-service"
)
RUN_INSTALL="${RUN_INSTALL:-true}"

run_root_install() {
  if [[ "$RUN_INSTALL" == "true" ]]; then
    echo "[root] Installing shared dependencies"
    pushd "$REPO_ROOT" >/dev/null
    npm ci --no-audit --no-fund
    popd >/dev/null
  fi
}

run_install() {
  if [[ "$RUN_INSTALL" == "true" ]]; then
    npm ci --no-audit --no-fund
  fi
}

run_backend_service() {
  local service="$1"
  local svc_dir="$REPO_ROOT/backend/services/$service"
  echo "[backend] Building service: $service"
  pushd "$svc_dir" >/dev/null
  run_install
  npm run build
  
  if grep -q '"test":' package.json; then
    echo "[backend] Running tests for $service"
    npm test
  fi

  popd >/dev/null
}

run_frontend() {
  echo "[frontend] Linting and building"
  pushd "$FRONTEND_DIR" >/dev/null
  run_install
  npm run lint
  npm run build

  if grep -q '"test":' package.json; then
    echo "[frontend] Running tests"
    npm test
  fi

  popd >/dev/null
}

main() {
  run_root_install
  for svc in "${BACKEND_SERVICES[@]}"; do
    run_backend_service "$svc"
  done

  run_frontend
}

main "$@"
