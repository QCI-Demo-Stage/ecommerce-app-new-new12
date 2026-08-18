# Ecommerce App New

Backend data layer for the ecommerce platform: PostgreSQL schema, reversible TypeScript migrations (`node-pg-migrate`), seed data, and schema documentation.

## Quick start

```bash
cp .env.example .env
npm install
npm run migrate:up
npm run db:seed
```

See [docs/schema.md](docs/schema.md) for the ER diagram, table definitions, migration commands, and rollback instructions.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run migrate:up` | Apply pending migrations |
| `npm run migrate:down` | Roll back the last migration |
| `npm run db:seed` | Insert demo users, products, and inventory |
| `npm run db:reset` | Down all → up → seed |
| `npm run lint` | ESLint on migrations, seeds, and src |
| `npm run typecheck` | TypeScript static analysis |
| `npm run db:validate` | typecheck + lint + migrate + seed |
