# Ecommerce App New — User Authentication Service

Secure OAuth2/JWT authentication for the ecommerce backend.

## Auth flow diagram

See [docs/auth_flow.png](docs/auth_flow.png) for the registration, login, token issuance, and refresh sequence diagram.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | Public | Register with email/password (bcrypt-hashed) |
| `POST` | `/auth/login` | Public | Login; returns access + refresh JWTs |
| `POST` | `/auth/refresh` | Public | Exchange refresh token for a new token pair |
| `GET` | `/api/me` | Bearer access token | Example protected route |

## Quick start

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to long random values (≥32 characters) before any non-local use.
