#!/usr/bin/env bash
# Client-side Helm dry-run for the staging chart.
# Equivalent to: helm install --dry-run (no cluster required).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHART_DIR="${ROOT_DIR}/chart/staging"
RELEASE_NAME="${RELEASE_NAME:-ecommerce-staging}"
NAMESPACE="${NAMESPACE:-staging}"
IMAGE_TAG="${IMAGE_TAG:-dry-run}"

echo "==> helm lint"
helm lint "${CHART_DIR}" -f "${CHART_DIR}/values-staging.yaml"

echo "==> helm install --dry-run (client-side via helm template)"
# Helm's `install --dry-run` requires a reachable Kubernetes API for REST mapping
# in current Helm releases. `helm template` is the supported offline dry-run path.
helm template "${RELEASE_NAME}" "${CHART_DIR}" \
  -f "${CHART_DIR}/values-staging.yaml" \
  --set "backend.image.tag=${IMAGE_TAG}" \
  --set "frontend.image.tag=${IMAGE_TAG}" \
  --namespace "${NAMESPACE}" \
  >/dev/null

echo "==> rendering sample dry-run manifests (excerpt)"
helm template "${RELEASE_NAME}" "${CHART_DIR}" \
  -f "${CHART_DIR}/values-staging.yaml" \
  --set "backend.image.tag=${IMAGE_TAG}" \
  --set "frontend.image.tag=${IMAGE_TAG}" \
  --namespace "${NAMESPACE}" \
  | grep -E 'kind: (Deployment|Service|Ingress)|livenessProbe|readinessProbe|image:|replicas:'

echo "DRY-RUN OK: staging chart rendered successfully"
