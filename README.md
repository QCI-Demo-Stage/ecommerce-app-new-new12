# Ecommerce App New

Basic e-commerce application (React + Vite frontend, Express TypeScript API) with
multi-arch container builds and Kubernetes staging deployment.

## Container images

| File | Service | Default port |
|------|---------|--------------|
| `Dockerfile.backend` | REST API | 3000 |
| `Dockerfile.frontend` | React SPA (Vite) | 8080 |

Both images use `node:20-alpine`, accept build-time args, and support
`linux/amd64` and `linux/arm64` via Docker Buildx.

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -f Dockerfile.backend -t ecommerce-backend:local --load .

docker buildx build --platform linux/amd64,linux/arm64 \
  -f Dockerfile.frontend -t ecommerce-frontend:local --load .
```

## CI: build & push (`.github/workflows/docker-build.yml`)

On push to `main`/`develop`, the workflow:

1. Configures AWS credentials from repository secrets
2. Sets up QEMU + Docker Buildx
3. Runs `docker buildx build --platform linux/amd64,linux/arm64 --push`
4. Tags images with the commit SHA and uploads image URIs as artifacts
5. Deploys to staging with Helm (when secrets are present)

Required secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`,
`AWS_ACCOUNT_ID`. Staging deploy also needs `KUBE_CONFIG_STAGING`.

## Staging Helm chart (`chart/staging`)

```bash
helm lint ./chart/staging
./scripts/validate-helm-staging.sh

helm upgrade --install ecommerce-staging ./chart/staging \
  -f ./chart/staging/values-staging.yaml \
  --namespace staging --create-namespace --dry-run
```
