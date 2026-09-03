# Ecommerce App New — Backend

Secure OAuth2/JWT authentication and multi-provider payment services for the ecommerce backend.

## Auth flow diagram

See [docs/auth_flow.png](docs/auth_flow.png) for the registration, login, token issuance, and refresh sequence diagram.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | Public | Register with email/password (bcrypt-hashed) |
| `POST` | `/auth/login` | Public | Login; returns access + refresh JWTs |
| `POST` | `/auth/refresh` | Public | Exchange refresh token for a new token pair |
| `GET` | `/api/me` | Bearer access token | Example protected route |
| `POST` | `/payments/customers` | Bearer | Create Stripe/PayPal customer + encrypted PM token |
| `POST` | `/payments/charges` | Bearer | Charge order (PayPal: create + capture, encrypt order ID) |
| `POST` | `/payments/refunds` | Bearer | Full or partial refund |

Payment design notes: [docs/payment-service-design.md](docs/payment-service-design.md).

## Quick start

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to long random values (≥32 characters) before any non-local use.

For PayPal sandbox charging, set `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` (omit them to use the simulated adapter in tests).

```bash
npm test
npm run typecheck
```
