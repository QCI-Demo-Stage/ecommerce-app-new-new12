#!/usr/bin/env bash
# Client-side Helm dry-run for the staging chart.
# Equivalent to: helm install --dry-run (no cluster required).
# Note: modern Helm still contacts the API server for `helm install --dry-run`
# unless a cluster is available; `helm template` is the offline dry-run path.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHART_DIR="${ROOT_DIR}/chart/staging"
RELEASE_NAME="${RELEASE_NAME:-ecommerce-staging}"
NAMESPACE="${NAMESPACE:-staging}"
IMAGE_TAG="${IMAGE_TAG:-dry-run}"

echo "==> helm lint"
helm lint "${CHART_DIR}"

echo "==> helm install --dry-run (client-side via helm template)"
helm template "${RELEASE_NAME}" "${CHART_DIR}" \
  -f "${CHART_DIR}/values-staging.yaml" \
  --set "backend.image.tag=${IMAGE_TAG}" \
  --set "frontend.image.tag=${IMAGE_TAG}" \
  --namespace "${NAMESPACE}" \
  >/dev/null

# Also attempt classic dry-run when a cluster is configured
if kubectl cluster-info >/dev/null 2>&1; then
  echo "==> helm install --dry-run (cluster available)"
  helm install "${RELEASE_NAME}" "${CHART_DIR}" \
    -f "${CHART_DIR}/values-staging.yaml" \
    --set "backend.image.tag=${IMAGE_TAG}" \
    --set "frontend.image.tag=${IMAGE_TAG}" \
    --namespace "${NAMESPACE}" \
    --dry-run
else
  echo "==> skipping cluster dry-run (no Kubernetes API); rendered manifests below"
  helm template "${RELEASE_NAME}" "${CHART_DIR}" \
    -f "${CHART_DIR}/values-staging.yaml" \
    --set "backend.image.tag=${IMAGE_TAG}" \
    --set "frontend.image.tag=${IMAGE_TAG}" \
    --namespace "${NAMESPACE}"
fi

echo "DRY-RUN OK: staging chart rendered successfully"
