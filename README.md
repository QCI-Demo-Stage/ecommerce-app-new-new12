# Ecommerce App New

Secure authentication and payment abstraction for the ecommerce backend.

## Auth

See [docs/auth_flow.png](docs/auth_flow.png) for the registration, login, token
issuance, and refresh sequence.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | Public | Register with email/password (bcrypt-hashed) |
| `POST` | `/auth/login` | Public | Login; returns access + refresh JWTs |
| `POST` | `/auth/refresh` | Public | Exchange refresh token for a new token pair |
| `GET` | `/api/me` | Bearer access token | Example protected route |

## Payments

Design & security model: [docs/payment-service-design.md](docs/payment-service-design.md)  
OpenAPI: [docs/openapi/payment-service.yaml](docs/openapi/payment-service.yaml)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/payments/customers` | Bearer | Create payment customer (`createCustomer`) |
| `POST` | `/payments/charges` | Bearer | Charge an order (`chargeOrder`) |
| `POST` | `/payments/refunds` | Bearer | Refund a charge (`refund`) |

Payment tokens are stored only as simulated-KMS ciphertext in
`payment_tokens.token_encrypted` (see `db/schema.sql` and `migrations/`).

## Quick start (API)

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Set `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `PAYMENT_KMS_SECRET` to long
random values (≥32 characters) before any non-local use.

## Schema verification (read-only)

```bash
npm install
npm run verify:sql
npm run lint:openapi
```

Do **not** run `migrate up` against production, staging, or shared databases
from automated agents. Human operators apply migrations after review.
