# Ecommerce App New

Basic e-commerce application with React (Vite) frontend, TypeScript Express API,
multi-arch Docker images, and Helm-based staging deployment.

## CI/CD

- Workflow: `.github/workflows/docker-build.yml`
- Builds `linux/amd64` + `linux/arm64` images via Docker Buildx
- Pushes to simulated AWS ECR tagged with the commit SHA
- Deploys to Kubernetes staging with Helm (`chart/staging`) after merge to `main`

## Local Helm dry-run

```bash
helm install ecommerce-staging ./chart/staging \
  -f ./chart/staging/values-staging.yaml \
  --dry-run --debug
```

## Required GitHub secrets

- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (optional), `AWS_ACCOUNT_ID` (optional)
- `KUBE_CONFIG_STAGING` (base64-encoded kubeconfig)
