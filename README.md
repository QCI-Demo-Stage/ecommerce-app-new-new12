# Ecommerce App New

Mobile-first ecommerce platform: Express/JWT backend and React storefront.

## Packages

| Path | Description |
|------|-------------|
| [`backend/`](./backend) | REST API — auth and product catalog (`GET /products`, `GET /products/:id`) |
| [`frontend/`](./frontend) | React SPA — UI library, catalog grid, product detail pages |

## Frontend (catalog & UI)

```bash
cd frontend
npm install
npm run test
npm run dev
```

See [frontend/README.md](./frontend/README.md) for tokens, routing, and a11y notes.

## Backend (auth + products)

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/products` | Paginated catalog (`page`, `pageSize`, `category`, `q`) |
| `GET` | `/products/:id` | Product detail |
| `POST` | `/auth/register` | Register |
| `POST` | `/auth/login` | Login (JWT pair) |
| `POST` | `/auth/refresh` | Refresh tokens |

Auth flow diagram: [docs/auth_flow.png](./docs/auth_flow.png).

## Story

Implements **Implement product catalog grid and detail pages** (`ce8d361c-dded-4b17-9811-d64626f7eb03`).
