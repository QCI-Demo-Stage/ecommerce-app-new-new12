# Ecommerce App New — Frontend

React + TypeScript SPA for the ecommerce storefront, including the shared UI library, product catalog, shopping cart, multi-step checkout, and protected account screens.

## What’s included

| Area | Details |
|------|---------|
| **Design tokens** | Colors, spacing, typography, radii, grid columns/gutters, safe-area insets (`src/tokens`) |
| **Components** | `Button`, `Input`, `Card`, `Navigation`, `Layout`, `LazyImage`, `ProductCard`, `CatalogGrid`, `ConfirmDialog`, `AccountNav`, `UnauthenticatedFallback`, `ApiErrorState` |
| **Cart** | Global `CartProvider` (localStorage-backed) with `useCart` / `useCartActions`; Cart page with editable quantities and remove confirmation |
| **Pages** | `/products` catalog, `/products/:id` detail, `/cart`, `/checkout` wizard, `/account` profile, `/account/orders` history |
| **Checkout** | `CheckoutWizard` — Shipping → Payment → Review → Confirmation with React Hook Form validation and `POST /api/orders` |
| **Auth** | `PrivateRoute` JWT gate, sessionStorage token helpers, sign-in fallback |
| **API** | Typed clients for products, profile (`GET`/`PATCH /api/me`), orders (`GET`/`POST /api/orders`), checkout helpers |
| **A11y** | WCAG 2.1 AA-oriented labels, landmarks, keyboard nav, skip link, live regions |
| **Perf** | Route-level code splitting, IntersectionObserver image lazy-loading, place-order under 2s UX budget, Vite proxy |

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
- Cart: `/cart`
- Checkout: `/checkout` (requires JWT; uses live cart lines from `CartProvider`)
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

## Cart context

- `CartProvider` wraps the app and hydrates from `localStorage` key `ecom_cart_v1`
- `useCart()` exposes read-only `{ items, totals }` (item count + subtotal cents)
- `useCartActions()` exposes `addItem`, `removeItem`, `updateQuantity`, `clearCart`
- Invalid / corrupt storage payloads fall back to an empty cart; quantities are clamped to 1–99
- Product detail **Add to cart** writes through the context; checkout clears the cart after a successful order

## Cart page

- Consumes `useCart` / `useCartActions` for line items and live totals
- Quantity `Input` updates cart state; subtotal and item count recalculate immediately
- Remove uses an accessible `ConfirmDialog` (`role="alertdialog"`) before deleting a line
- Responsive layout: stacked on mobile, line list + summary sidebar from `768px`

## Checkout wizard

- Steps: **Shipping** → **Payment** → **Review** → **Confirmation**
- Client-side validation via React Hook Form (`onBlur` mode)
- Card numbers are **tokenized in the browser**; only opaque tokens + last-4 are sent to `POST /api/orders`
- Loading indicator on place-order; soft 2s client budget (`CHECKOUT_PERF_BUDGET_MS`)
- `CheckoutPage` maps live cart lines via `toCheckoutItems` and clears the cart on success

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
- **Create multi-step CheckoutWizard with validation** (`a7509da1-48b4-4292-8400-03827a5026a0`)
- **Build Cart UI and editable line-item list** (`bd02236d-d894-4cab-a4a9-989d8b46f469`)
- **Implement global Cart context and state management** (`e2fe8941-ba52-43eb-854c-1b1eb025a19a`)
