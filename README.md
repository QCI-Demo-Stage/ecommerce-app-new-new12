# Ecommerce App New

Containerized ecommerce sample with multi-arch Docker images, GitHub Actions
ECR push workflow, and a Helm chart for Kubernetes staging.

## Layout

- `Dockerfile.backend` / `Dockerfile.frontend` — multi-arch (`linux/amd64`, `linux/arm64`) images based on `node:20-alpine`
- `.github/workflows/docker-build.yml` — buildx build/push to simulated AWS ECR, image URI artifacts, staging Helm dry-run
- `chart/staging` — Helm chart (Deployment, Service, Ingress, probes) with `values-staging.yaml`
- `backend/` — TypeScript Express API
- `frontend/` — React + Vite SPA

## Required repository secrets

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Optional: `AWS_REGION`, `AWS_ACCOUNT_ID` (defaults simulate ECR account `123456789012`).

## Local verification

```bash
actionlint .github/workflows/docker-build.yml
./scripts/validate-helm-staging.sh
```

Live `helm upgrade --install` to the staging cluster is withheld for human approval after merge.
