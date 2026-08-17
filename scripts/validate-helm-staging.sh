#!/usr/bin/env bash
# Client-side Helm dry-run for the staging chart.
# Equivalent to: helm install --dry-run (no cluster required).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHART_DIR="${ROOT_DIR}/chart/staging"
RELEASE_NAME="${RELEASE_NAME:-ecommerce-staging}"
NAMESPACE="${NAMESPACE:-staging}"
IMAGE_TAG="${IMAGE_TAG:-dry-run}"
OUT_FILE="${OUT_FILE:-/tmp/ecommerce-staging-manifests.yaml}"

echo "==> helm lint"
helm lint "${CHART_DIR}"

echo "==> helm template (offline dry-run / install --dry-run equivalent)"
# Helm's `install --dry-run` requires a reachable Kubernetes API for REST mapping
# in current Helm releases. `helm template` is the supported offline dry-run path.
helm template "${RELEASE_NAME}" "${CHART_DIR}" \
  -f "${CHART_DIR}/values-staging.yaml" \
  --set "backend.image.tag=${IMAGE_TAG}" \
  --set "frontend.image.tag=${IMAGE_TAG}" \
  --namespace "${NAMESPACE}" \
  > "${OUT_FILE}"

echo "==> rendered manifests written to ${OUT_FILE}"
# kubectl apply --dry-run=client needs API discovery; skip when no cluster.
if kubectl cluster-info >/dev/null 2>&1; then
  echo "==> kubectl apply --dry-run=client"
  kubectl apply --dry-run=client -f "${OUT_FILE}"
else
  echo "==> kubectl apply --dry-run=client skipped (no cluster); helm template OK"
fi

echo "DRY-RUN OK: staging chart rendered successfully"
