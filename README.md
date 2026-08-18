# Ecommerce App New — Backend

Secure authentication and payment service abstraction for the ecommerce API.

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | Public | Register with email/password (bcrypt-hashed) |
| `POST` | `/auth/login` | Public | Login; returns access + refresh JWTs |
| `POST` | `/auth/refresh` | Public | Exchange refresh token for a new token pair |
| `GET` | `/api/me` | Bearer | Example protected route |

Auth flow diagram: [docs/auth_flow.png](docs/auth_flow.png)

## Payments

OpenAPI contract: [`openapi.yaml`](../openapi.yaml)  
Design & security model: [docs/payment-service-design.md](../docs/payment-service-design.md)

| Method | Path | Auth | Operation |
|--------|------|------|-----------|
| `POST` | `/payments/customers` | Bearer | `createCustomer` |
| `POST` | `/payments/charges` | Bearer | `chargeOrder` |
| `POST` | `/payments/refunds` | Bearer | `refund` |

Only **tokenized** payment method references are accepted. Tokens are encrypted
with a simulated KMS (`PAYMENT_KMS_KEY`) before storage. Schema migration
(authored, not auto-applied): `migrations/1744500000000_create-payment-tokens.ts`.

## Quick start

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

```bash
npm test
npm run typecheck
npm run openapi:lint
```

Set `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `PAYMENT_KMS_KEY` before any
non-local use. Do **not** run `migrate:up` against shared environments without
explicit human approval.
