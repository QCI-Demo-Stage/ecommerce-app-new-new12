#!/usr/bin/env bash
# Client-side Helm dry-run for the staging chart.
# Preferred: helm install --dry-run (requires a reachable Kubernetes API).
# Fallback:  helm template (offline dry-run when no cluster is available).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHART_DIR="${ROOT_DIR}/chart/staging"
RELEASE_NAME="${RELEASE_NAME:-ecommerce-staging}"
NAMESPACE="${NAMESPACE:-staging}"
IMAGE_TAG="${IMAGE_TAG:-dry-run}"

echo "==> helm lint"
helm lint "${CHART_DIR}"

echo "==> attempting helm install --dry-run"
if helm install "${RELEASE_NAME}" "${CHART_DIR}" \
  --namespace "${NAMESPACE}" \
  --create-namespace \
  --dry-run \
  -f "${CHART_DIR}/values-staging.yaml" \
  --set "backend.image.tag=${IMAGE_TAG}" \
  --set "frontend.image.tag=${IMAGE_TAG}" \
  >/tmp/helm-install-dry-run.yaml 2>/tmp/helm-install-dry-run.err; then
  echo "helm install --dry-run succeeded"
  wc -l /tmp/helm-install-dry-run.yaml
else
  echo "helm install --dry-run unavailable without cluster:"
  tr '\n' ' ' </tmp/helm-install-dry-run.err || true
  echo
  echo "==> falling back to helm template client-side dry-run"
  helm template "${RELEASE_NAME}" "${CHART_DIR}" \
    -f "${CHART_DIR}/values-staging.yaml" \
    --set "backend.image.tag=${IMAGE_TAG}" \
    --set "frontend.image.tag=${IMAGE_TAG}" \
    --namespace "${NAMESPACE}" \
    >/tmp/helm-install-dry-run.yaml
fi

echo "==> sample rendered resources"
grep -E '^kind: ' /tmp/helm-install-dry-run.yaml | sort | uniq -c

echo "DRY-RUN OK: staging chart rendered successfully"
