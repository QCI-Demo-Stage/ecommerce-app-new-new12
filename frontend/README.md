# Ecommerce App New — Frontend

React + TypeScript SPA for the ecommerce storefront, including the shared UI library and product catalog pages.

## What’s included

| Area | Details |
|------|---------|
| **Design tokens** | Colors, spacing, typography, radii, grid columns/gutters, safe-area insets (`src/tokens`) |
| **Components** | `Button`, `Input`, `Card`, `Navigation`, `Layout`, `LazyImage`, `ProductCard`, `CatalogGrid` |
| **Pages** | `/products` catalog grid, `/products/:id` detail view |
| **API** | Typed client for `GET /products` (pagination) and `GET /products/:id` |
| **A11y** | WCAG 2.1 AA-oriented labels, landmarks, keyboard nav, skip link, live regions |
| **Perf** | Route-level code splitting, IntersectionObserver image lazy-loading, Vite proxy |

## Quick start

```bash
# Terminal 1 — API (serves GET /products)
cd backend
cp .env.example .env
npm install
npm run dev

# Terminal 2 — SPA (proxies /products to the API)
cd frontend
npm install
npm run dev
```

Open the Vite URL (default `http://localhost:5173`). Catalog: `/products`. Detail: `/products/:id`.

Optional: set `VITE_API_BASE_URL` to point at a remote API instead of the Vite proxy.

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run test` | Unit / integration tests (Jest + RTL) |
| `npm run storybook` | Component docs & breakpoint previews |
| `npm run typecheck` | TypeScript project references check |
| `npm run build` | Production Vite build |
| `npm run lint` | oxlint |

## Catalog & detail behavior

- `CatalogGrid` calls `GET /products?page=&pageSize=` and maps each item to `ProductCard` (shared `Card`).
- Product images load via `LazyImage` (`IntersectionObserver`) when near the viewport.
- `ProductDetailPage` reads `:id` from React Router, fetches `GET /products/:id`, and renders image, description, price, and an accessible Add to cart button.

## Story IDs

- **Create reusable UI component library and base layout** (`d0da3e7b-35ae-4365-8ba5-3a2b05e44a74`)
- **Implement product catalog grid and detail pages** (`ce8d361c-dded-4b17-9811-d64626f7eb03`)
