# Ecommerce App New

Mobile-first ecommerce platform: Express/JWT backend and React UI component library.

## Packages

| Path | Description |
|------|-------------|
| [`backend/`](./backend) | REST API — auth (register, login, refresh) and protected routes |
| [`frontend/`](./frontend) | Shared UI library (Button, Input, Card, Navigation), design tokens, responsive `Layout` |

## Frontend (component library)

```bash
cd frontend
npm install
npm run test
npm run storybook
```

See [frontend/README.md](./frontend/README.md) for tokens, breakpoints, and usage.

## Backend (auth service)

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Auth flow diagram: [docs/auth_flow.png](./docs/auth_flow.png).
