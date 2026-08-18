# Ecommerce App New

Backend data layer for the ecommerce platform: PostgreSQL schema, reversible TypeScript migrations (`node-pg-migrate`), seed data, and documentation.

## Quick start

```bash
cp .env.example .env   # set DATABASE_URL to your local Postgres
npm install
npm run migrate:up     # apply schema + demo seed
```

## Documentation

- [Schema & migration guide](docs/schema.md) — tables, ER diagram, migrate / rollback
- Reference DDL: `db/schema.sql`
- TypeScript models: `src/schema/models.ts`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run migrate:up` | Apply pending migrations |
| `npm run migrate:down` | Roll back one migration |
| `npm run typecheck` | TypeScript static check |
| `npm run verify:sql` | Lint SQL + migration structure |
| `npm run verify` | Ephemeral local DB dry-run (up/down/seed) |

Production migrate/apply is withheld for human operators — use verify/dry-run in CI.
