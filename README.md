# Ecommerce App New

Basic e-commerce application (React/Vite frontend + Node/Express backend) with multi-arch container builds and Kubernetes staging deployment via Helm.

## Layout

- `Dockerfile.backend` / `Dockerfile.frontend` — multi-arch (`linux/amd64`, `linux/arm64`) images on `node:20-alpine`
- `.github/workflows/docker-build.yml` — Buildx build, push to simulated AWS ECR (SHA tags), upload image URI artifacts
- `chart/staging` — Helm chart (Deployment, Service, Ingress, probes) + `values-staging.yaml`

## Required repository secrets / variables

| Secret / variable | Purpose |
| --- | --- |
| `AWS_ACCESS_KEY_ID` | AWS credentials for ECR (and optional EKS) |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials for ECR (and optional EKS) |
| `AWS_REGION` (var, optional) | Defaults to `us-east-1` |
| `ECR_REGISTRY` (var, optional) | Simulated ECR registry host |
| `EKS_CLUSTER_NAME` (var, optional) | Staging cluster name |

## Local verification (read-only)

```bash
helm template ecommerce-staging ./chart/staging -f ./chart/staging/values-staging.yaml
helm install ecommerce-staging ./chart/staging -f ./chart/staging/values-staging.yaml --dry-run --debug
kubectl apply --dry-run=client -f <(helm template ecommerce-staging ./chart/staging -f ./chart/staging/values-staging.yaml)
```

Mutating steps (`helm upgrade`/`install` without `--dry-run`, `kubectl apply` without dry-run, live ECR push outside CI) are withheld for human approval.
