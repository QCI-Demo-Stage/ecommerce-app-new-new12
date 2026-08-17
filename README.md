# Ecommerce App New

Containerized ecommerce sample with multi-arch Docker images, GitHub Actions
ECR push / production promotion workflows, Helm chart (staging + prod values),
Prometheus metrics, health probes, and monitoring configs.

## Layout

- `Dockerfile.backend` / `Dockerfile.frontend` — multi-arch (`linux/amd64`, `linux/arm64`) images based on `node:20-alpine`
- `.github/workflows/docker-build.yml` — buildx build/push to simulated AWS ECR, staging Helm dry-run
- `.github/workflows/promote-prod.yml` — one-click / tag-triggered production promotion (`helm upgrade --install` after `production` env approval)
- `chart/staging` — Helm chart with probes on `/health` + `/ready`, `values-staging.yaml`, `values-prod.yaml`
- `backend/` — TypeScript Express API with `prom-client` `/metrics`
- `frontend/` — React + Vite SPA served by Express metrics server (`/metrics`, `/health`, `/ready`)
- `monitoring/` — Prometheus rules, scrape configs, SLOs, Grafana dashboard, PrometheusRule CRDs
- `docs/RUNBOOK.md` — metrics, alerts, promotion, rollback

## Required repository secrets

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Optional: `AWS_REGION`, `AWS_ACCOUNT_ID` (defaults simulate ECR account `123456789012`), `PROD_HEALTH_URL`.  
Required for live promotion: `KUBE_CONFIG_PROD` (base64-encoded kubeconfig).

Configure the GitHub Environment `production` with required reviewers for promotion approval.

## Local verification

```bash
./scripts/verify-monitoring.sh
./scripts/validate-helm-staging.sh
cd backend && npm run lint
cd frontend && npm run lint
```

`kubectl apply` of PrometheusRule CRDs (`monitoring/kubernetes/`) is withheld for a human with cluster RBAC after merge.  
Production promotion is gated by the `production` GitHub Environment; do not trigger it from authoring workspaces.
