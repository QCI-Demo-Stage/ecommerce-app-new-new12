# Database Schema and Migration Guide

This document describes the PostgreSQL core data model for **Ecommerce App New**, including entity relationships, table definitions, migration commands, and rollback procedures.

## ER diagram

High-level Entity–Relationship diagram covering `users`, `products`, `inventory`, `orders`, and `audit_logs`:

![Ecommerce Core Data Model ER diagram](./images/er-diagram.png)

### Relationship summary

| Relationship | Cardinality | Notes |
| --- | --- | --- |
| `users` → `orders` | 1:N | A user places many orders (`orders.user_id`) |
| `products` → `inventory` | 1:1 | One inventory row per product (`inventory.product_id` unique) |
| `users` → `audit_logs` | 1:N (optional) | Actor may be null for system actions (`audit_logs.actor_id`) |
| `orders.items` → `products` | logical | Line items stored as JSONB referencing product IDs |

---

## Tables

### `users`

Authenticated accounts for customers, admins, and support staff.

| Column | Type | Constraints | Purpose |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Stable user identifier |
| `email` | `varchar(255)` | UNIQUE, NOT NULL | Login identifier |
| `password_hash` | `varchar(255)` | NOT NULL | bcrypt (or compatible) password hash — **never store plaintext** |
| `first_name` | `varchar(100)` | NOT NULL | Given name |
| `last_name` | `varchar(100)` | NOT NULL | Family name |
| `role` | `varchar(32)` | NOT NULL, check ∈ {`customer`,`admin`,`support`} | Authorization role |
| `is_active` | `boolean` | NOT NULL, default `true` | Soft disable without deleting |
| `created_at` | `timestamptz` | NOT NULL | Row creation time |
| `updated_at` | `timestamptz` | NOT NULL | Maintained by trigger |

**Indexes:** `email`, `role`

---

### `products`

Catalog entries available for sale.

| Column | Type | Constraints | Purpose |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Product identifier |
| `sku` | `varchar(64)` | UNIQUE, NOT NULL | External stock-keeping unit |
| `name` | `varchar(255)` | NOT NULL | Display name |
| `description` | `text` | nullable | Marketing / detail copy |
| `price` | `numeric(12,2)` | NOT NULL, ≥ 0 | Unit price |
| `category` | `varchar(100)` | nullable | Catalog grouping |
| `is_active` | `boolean` | NOT NULL, default `true` | Visibility / purchasability |
| `created_at` | `timestamptz` | NOT NULL | Created |
| `updated_at` | `timestamptz` | NOT NULL | Updated via trigger |

**Indexes:** `sku`, `category`, `name`, `is_active`

---

### `inventory`

Stock levels for each product (one row per product).

| Column | Type | Constraints | Purpose |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Inventory row id |
| `product_id` | `uuid` | UNIQUE FK → `products(id)` ON DELETE CASCADE | Linked product |
| `quantity` | `integer` | NOT NULL, ≥ 0 | On-hand quantity |
| `reserved_quantity` | `integer` | NOT NULL, ≥ 0, ≤ `quantity` | Held for open carts/orders |
| `warehouse_location` | `varchar(100)` | nullable | Bin / aisle code |
| `updated_at` | `timestamptz` | NOT NULL | Last stock change |

**Indexes:** `product_id`, `warehouse_location`

Available quantity for sale = `quantity - reserved_quantity`.

---

### `orders`

Customer purchase records. Line items live in `items` JSONB to keep the required five-table core model cohesive while capturing product references at order time.

| Column | Type | Constraints | Purpose |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Order identifier |
| `user_id` | `uuid` | FK → `users(id)` ON DELETE RESTRICT | Ordering user |
| `status` | `varchar(32)` | check ∈ {`pending`,`paid`,`shipped`,`delivered`,`cancelled`} | Fulfillment state |
| `total_amount` | `numeric(12,2)` | NOT NULL, ≥ 0 | Order total |
| `currency` | `char(3)` | NOT NULL, default `USD` | ISO currency code |
| `items` | `jsonb` | NOT NULL, default `[]` | Array of `{product_id, sku, quantity, unit_price}` |
| `shipping_address` | `jsonb` | nullable | Structured ship-to address |
| `notes` | `text` | nullable | Customer / ops notes |
| `created_at` | `timestamptz` | NOT NULL | Placed at |
| `updated_at` | `timestamptz` | NOT NULL | Status / content updates |

**Indexes:** `user_id`, `status`, `created_at`, GIN on `items`

Example `items` payload:

```json
[
  {
    "product_id": "11111111-1111-1111-1111-111111111111",
    "sku": "SKU-1001",
    "quantity": 2,
    "unit_price": 249.99
  }
]
```

---

### `audit_logs`

Immutable-style activity trail for security and operational auditing.

| Column | Type | Constraints | Purpose |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | Log entry id |
| `entity_type` | `varchar(64)` | NOT NULL | Target entity name (`users`, `orders`, …) |
| `entity_id` | `uuid` | NOT NULL | Target row id |
| `action` | `varchar(64)` | NOT NULL | Action verb (`create`, `update`, `db.seed`, …) |
| `actor_id` | `uuid` | FK → `users(id)` ON DELETE SET NULL | Acting user (nullable for system) |
| `changes` | `jsonb` | nullable | Before/after or summary payload |
| `metadata` | `jsonb` | nullable | Request id, source, etc. |
| `ip_address` | `inet` | nullable | Client address when applicable |
| `created_at` | `timestamptz` | NOT NULL | Event time (no `updated_at` — append-only) |

**Indexes:** `(entity_type, entity_id)`, `actor_id`, `action`, `created_at`

---

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (validated on 16)
- Environment variable `DATABASE_URL` (see `.env.example`)

```bash
cp .env.example .env
# edit DATABASE_URL if needed
npm install
```

Create a local database (example):

```bash
sudo -u postgres psql -c "CREATE USER ecommerce WITH PASSWORD 'ecommerce_dev' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE ecommerce_dev OWNER ecommerce;"
```

---

## Migration framework

Migrations use **[node-pg-migrate](https://github.com/salsita/node-pg-migrate)** with **TypeScript** files under `migrations/`.

| File | Description |
| --- | --- |
| `migrations/1734566400000_create-core-schema.ts` | Creates extensions, tables, constraints, indexes, and `updated_at` triggers; `down` drops them in reverse order |

### Apply migrations (up)

```bash
npm run migrate:up
```

Equivalent:

```bash
npx node-pg-migrate up -m migrations --migration-file-language ts --tsconfig tsconfig.json
```

Applied migrations are recorded in the `pgmigrations` table.

### Create a new migration

```bash
npm run migrate:create -- add-something
```

### Seed demo data

Inserts 3 users (bcrypt-hashed passwords), **12 products**, matching inventory rows, and a seed audit entry:

```bash
npm run db:seed
```

Full reset (down all → up → seed):

```bash
npm run db:reset
```

### Lint and static analysis

```bash
npm run lint
npm run typecheck
```

Combined validation (typecheck + lint + migrate + seed):

```bash
npm run db:validate
```

---

## Rolling back migrations

### Roll back the last migration

```bash
npm run migrate:down
```

This executes the `down` function of the most recently applied migration (drops `audit_logs`, `orders`, `inventory`, `products`, `users`, triggers, and the `set_updated_at` function).

### Roll back all migrations

```bash
npx node-pg-migrate down -m migrations --migration-file-language ts --tsconfig tsconfig.json --all
```

Or via the reset helper (then re-applies and seeds):

```bash
npm run db:reset
```

### Safety notes

1. **Down migrations destroy schema objects and cascade-dependent data.** Prefer taking a backup (`pg_dump`) before rolling back shared environments.
2. Never run destructive rollbacks against production without explicit human approval.
3. After a rollback, re-run `npm run migrate:up` (and `npm run db:seed` if demo data is required).

---

## Security notes

- Store only **hashed** credentials in `users.password_hash` (seed script uses bcrypt).
- Keep real secrets out of git; `.env` is gitignored — commit `.env.example` only.
- Prefer TLS (`sslmode=require`) for non-local `DATABASE_URL` connections.
- `audit_logs` should be written by services for auth, inventory mutations, and order state changes.

---

## Project layout

```text
migrations/          # Reversible TypeScript migrations
seeds/seed.ts        # Demo users, products, inventory
src/schema-constants.ts
docs/schema.md       # This file
docs/images/er-diagram.png
.env.example
```
