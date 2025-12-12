#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'EOF'
Usage: scripts/build-linux-amd64.sh <service|all> [image-tag]

Builds Phoenix Booking Docker images for linux/amd64 using docker buildx.

Arguments:
  service     One of: frontend, api-gateway, identity-service, hotel-service,
               booking-service, search-service, notification-service, or "all".
  image-tag   Optional tag (defaults to amd64-<timestamp>). When building
               "all", the same tag is reused for every service.

Environment variables:
  ECR_REGISTRY   Defaults to 787169320414.dkr.ecr.us-east-1.amazonaws.com.
  PUSH           If "true", the image is pushed to the registry (default: true).
  PUSH_LATEST    When PUSH=true, also tag and push :latest (default: true).
  PLATFORM       Defaults to linux/amd64. Override only if you know what
                 you're doing.

Examples:
  # Build and push the frontend image with an explicit tag
  scripts/build-linux-amd64.sh frontend asgardeo-fix-amd64

  # Build every service (will re-use the generated tag)
  scripts/build-linux-amd64.sh all

  # Build locally without pushing (loads result into Docker)
  PUSH=false scripts/build-linux-amd64.sh api-gateway test-amd64
EOF
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  show_help
  exit 0
fi

if [[ $# -lt 1 ]]; then
  show_help >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SERVICE="${1}"
IMAGE_TAG="${2:-amd64-$(date +%Y%m%d%H%M)}"
ECR_REGISTRY="${ECR_REGISTRY:-787169320414.dkr.ecr.us-east-1.amazonaws.com}"
PUSH="${PUSH:-true}"
PUSH_LATEST="${PUSH_LATEST:-true}"
PLATFORM="${PLATFORM:-linux/amd64}"
FRONTEND_PUBLIC_URL="${FRONTEND_PUBLIC_URL:-http://phoenix-alb-1908878835.us-east-1.elb.amazonaws.com}"
FRONTEND_API_BASE_URL="${FRONTEND_API_BASE_URL:-${FRONTEND_PUBLIC_URL}/api}"
VITE_ASGARDEO_CLIENT_ID="${VITE_ASGARDEO_CLIENT_ID:-iYcA_MO8LwTND_hvunAg8VvBHDua}"
VITE_ASGARDEO_BASE_URL="${VITE_ASGARDEO_BASE_URL:-https://api.asgardeo.io/t/theenukagranex}"
VITE_ASGARDEO_SIGN_IN_REDIRECT="${VITE_ASGARDEO_SIGN_IN_REDIRECT:-${FRONTEND_PUBLIC_URL}/sign-in}"
VITE_ASGARDEO_SIGN_OUT_REDIRECT="${VITE_ASGARDEO_SIGN_OUT_REDIRECT:-$FRONTEND_PUBLIC_URL}"
VITE_ASGARDEO_SCOPES="${VITE_ASGARDEO_SCOPES:-openid profile email}"

if ! docker buildx version >/dev/null 2>&1; then
  echo "docker buildx is required. Please install Docker 20.10+" >&2
  exit 1
fi

build_service() {
  local svc="$1"
  local dockerfile
  local context
  local repository

  case "$svc" in
    frontend)
      dockerfile="$REPO_ROOT/hotel-booking-frontend/Dockerfile"
      context="$REPO_ROOT"
      repository="phoenix-frontend-service"
      ;;
    api-gateway)
      dockerfile="$REPO_ROOT/backend/services/api-gateway/Dockerfile"
      context="$REPO_ROOT"
      repository="phoenix-api-gateway-service"
      ;;
    identity-service)
      dockerfile="$REPO_ROOT/backend/services/identity-service/Dockerfile"
      context="$REPO_ROOT"
      repository="phoenix-identity-service"
      ;;
    hotel-service)
      dockerfile="$REPO_ROOT/backend/services/hotel-service/Dockerfile"
      context="$REPO_ROOT"
      repository="phoenix-hotel-service"
      ;;
    booking-service)
      dockerfile="$REPO_ROOT/backend/services/booking-service/Dockerfile"
      context="$REPO_ROOT"
      repository="phoenix-booking-service"
      ;;
    search-service)
      dockerfile="$REPO_ROOT/backend/services/search-service/Dockerfile"
      context="$REPO_ROOT/backend/services/search-service"
      repository="phoenix-search-service"
      ;;
    notification-service)
      dockerfile="$REPO_ROOT/backend/services/notification-service/Dockerfile"
      context="$REPO_ROOT/backend/services/notification-service"
      repository="phoenix-notification-service"
      ;;
    *)
      echo "Unknown service: $svc" >&2
      exit 1
      ;;
  esac

  local image="$ECR_REGISTRY/$repository"
  local build_cmd=(docker buildx build --platform "$PLATFORM" -f "$dockerfile" -t "$image:$IMAGE_TAG")

  if [[ "$svc" == "frontend" ]]; then
    build_cmd+=(
      --build-arg "VITE_API_BASE_URL=$FRONTEND_API_BASE_URL"
      --build-arg "VITE_ASGARDEO_CLIENT_ID=$VITE_ASGARDEO_CLIENT_ID"
      --build-arg "VITE_ASGARDEO_BASE_URL=$VITE_ASGARDEO_BASE_URL"
      --build-arg "VITE_ASGARDEO_SIGN_IN_REDIRECT=$VITE_ASGARDEO_SIGN_IN_REDIRECT"
      --build-arg "VITE_ASGARDEO_SIGN_OUT_REDIRECT=$VITE_ASGARDEO_SIGN_OUT_REDIRECT"
      --build-arg "VITE_ASGARDEO_SCOPES=$VITE_ASGARDEO_SCOPES"
    )
  fi

  if [[ "$PUSH" == "true" && "$PUSH_LATEST" == "true" ]]; then
    build_cmd+=(-t "$image:latest")
  fi

  if [[ "$PUSH" == "true" ]]; then
    build_cmd+=(--push)
  else
    build_cmd+=(--load)
  fi

  build_cmd+=("$context")

  echo "[build] Building $svc as $image:$IMAGE_TAG ($PLATFORM)"
  "${build_cmd[@]}"
}

if [[ "$SERVICE" == "all" ]]; then
  for svc in frontend api-gateway identity-service hotel-service booking-service search-service notification-service; do
    build_service "$svc"
  done
else
  build_service "$SERVICE"
fi
