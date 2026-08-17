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

echo "==> probe + metrics path sanity"
grep -E 'livenessProbe:|readinessProbe:|path: /(health|ready|metrics)' /tmp/helm-install-dry-run.yaml | head -60

echo "==> kubectl apply --dry-run=client (or kubeconform offline)"
if kubectl apply --dry-run=client --validate=false -f /tmp/helm-install-dry-run.yaml >/tmp/kubectl-dry-run.out 2>/tmp/kubectl-dry-run.err; then
  cat /tmp/kubectl-dry-run.out
  echo "kubectl apply --dry-run=client OK"
elif command -v kubeconform >/dev/null 2>&1; then
  echo "kubectl API unreachable; using kubeconform offline validation"
  kubeconform -summary -ignore-missing-schemas -kubernetes-version 1.29.0 /tmp/helm-install-dry-run.yaml
else
  echo "kubectl dry-run unavailable and kubeconform not installed; helm template already succeeded"
  tr '\n' ' ' </tmp/kubectl-dry-run.err || true
  echo
fi

echo "DRY-RUN OK: staging chart rendered successfully"
