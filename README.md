# Ecommerce App New

Mobile-first ecommerce platform: Express/JWT backend and React storefront.

## Packages

| Path | Description |
|------|-------------|
| [`backend/`](./backend) | REST API — auth, products, profile, orders (history + checkout) |
| [`frontend/`](./frontend) | React SPA — UI library, catalog, cart, checkout wizard, account screens |

## Frontend

```bash
cd frontend
npm install
npm run test
npm run dev
```

See [frontend/README.md](./frontend/README.md) for tokens, routing, and a11y notes.

Public cart UI lives at `/cart` (editable quantities, remove confirmation, live totals). Cart state is managed by a global `CartProvider` (localStorage-backed) with `useCart` / `useCartActions`. Protected routes (`/checkout`, `/account`, `/account/orders`) require a JWT access token (session storage). Unauthenticated visitors see an accessible sign-in fallback.

## Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/products` | Public | Paginated catalog |
| `GET` | `/products/:id` | Public | Product detail |
| `POST` | `/auth/register` | Public | Register |
| `POST` | `/auth/login` | Public | Login (JWT pair) |
| `POST` | `/auth/refresh` | Public | Refresh tokens |
| `GET` | `/api/me` | Bearer | Current user profile |
| `PATCH` | `/api/me` | Bearer | Update profile |
| `GET` | `/api/orders` | Bearer | Paginated order history |
| `POST` | `/api/orders` | Bearer | Place order (tokenized payment only) |
| `GET` | `/api/orders/:id` | Bearer | Order detail for owner |

Auth flow diagram: [docs/auth_flow.png](./docs/auth_flow.png).

## Story

Implements **Implement global Cart context and state management** (`e2fe8941-ba52-43eb-854c-1b1eb025a19a`), building on the Cart UI, checkout wizard, and protected account screens.
