# Ecommerce App New — Frontend

React + TypeScript SPA for the ecommerce storefront, including the shared UI library, product catalog, and protected account screens.

## What’s included

| Area | Details |
|------|---------|
| **Design tokens** | Colors, spacing, typography, radii, grid columns/gutters, safe-area insets (`src/tokens`) |
| **Components** | `Button`, `Input`, `Card`, `Navigation`, `Layout`, `LazyImage`, `ProductCard`, `CatalogGrid`, `AccountNav`, `UnauthenticatedFallback`, `ApiErrorState` |
| **Pages** | `/products` catalog, `/products/:id` detail, `/account` profile, `/account/orders` history |
| **Auth** | `PrivateRoute` JWT gate, sessionStorage token helpers, sign-in fallback |
| **API** | Typed clients for products, profile (`GET`/`PATCH /api/me`), and orders (`GET /api/orders`) |
| **A11y** | WCAG 2.1 AA-oriented labels, landmarks, keyboard nav, skip link, live regions |
| **Perf** | Route-level code splitting, IntersectionObserver image lazy-loading, Vite proxy |

## Quick start

```bash
# Terminal 1 — API
cd backend
cp .env.example .env
npm install
npm run dev

# Terminal 2 — SPA (proxies /products, /auth, /api)
cd frontend
npm install
npm run dev
```

Open the Vite URL (default `http://localhost:5173`).

- Catalog: `/products`
- Account profile: `/account` (requires JWT)
- Order history: `/account/orders` (requires JWT)

Optional: set `VITE_API_BASE_URL` to point at a remote API instead of the Vite proxy.

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run test` | Unit / integration tests (Jest + RTL) |
| `npm run storybook` | Component docs & breakpoint previews |
| `npm run typecheck` | TypeScript project references check |
| `npm run build` | Production Vite build |
| `npm run lint` | oxlint |

## Account screens

- `PrivateRoute` checks for a JWT access token in `sessionStorage` (`ecom_access_token`).
- Missing token → accessible **Sign in required** fallback that calls `POST /auth/login`.
- `ProfilePage` loads `GET /api/me`, validates editable fields client-side, and saves with `PATCH /api/me`.
- `OrderHistoryPage` loads `GET /api/orders?page=&pageSize=` with previous/next pagination and API error retry UI.
- Account secondary nav (`aria-label="Account"`) links Profile and Order history.

## Story IDs

- **Create reusable UI component library and base layout** (`d0da3e7b-35ae-4365-8ba5-3a2b05e44a74`)
- **Implement product catalog grid and detail pages** (`ce8d361c-dded-4b17-9811-d64626f7eb03`)
- **Develop protected User Account screens (Profile & Order History)** (`961d3ee3-b174-4f20-8688-17dddc7dd799`)
