# Ecommerce Core Database Schema

PostgreSQL relational schema for **Ecommerce App New** covering users, products, inventory, orders, and audit logs. Migrations are managed with [`node-pg-migrate`](https://github.com/salsita/node-pg-migrate) (TypeScript).

## Entity-Relationship Diagram

![Ecommerce core ER diagram](./images/er-diagram.png)

### Relationships (summary)

| From | To | Cardinality | Notes |
|------|----|-------------|-------|
| `users` | `orders` | 1:N | Order owner; delete restricted while orders exist |
| `users` | `audit_logs` | 1:N | Optional actor; `ON DELETE SET NULL` |
| `products` | `inventory` | 1:1 | Unique `product_id` on inventory |
| `products` | `order_items` | 1:N | Line items; product delete restricted |
| `orders` | `order_items` | 1:N | Cascade delete with parent order |

`order_items` is the join entity for multi-product orders (part of the orders subdomain).

---

## Tables

### `users`

Application accounts for authentication and authorization. Passwords are stored **only** as one-way hashes (`password_hash`); plaintext credentials are never persisted.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | `UUID` PK | Surrogate key (`gen_random_uuid()`) |
| `email` | `CITEXT` UK | Login identifier (case-insensitive) |
| `password_hash` | `TEXT` | bcrypt/argon2 hash |
| `first_name` | `VARCHAR(100)` | Given name |
| `last_name` | `VARCHAR(100)` | Family name |
| `role` | `user_role` | `customer` \| `admin` \| `support` |
| `is_active` | `BOOLEAN` | Soft disable without delete |
| `last_login_at` | `TIMESTAMPTZ` | Last successful auth |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | Audit timestamps |

**Indexes:** `email`, `role`, `is_active`

### `products`

Catalog entries sold by the storefront.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | `UUID` PK | Surrogate key |
| `sku` | `VARCHAR(64)` UK | Stock-keeping unit |
| `name` | `VARCHAR(255)` | Display name |
| `description` | `TEXT` | Long description |
| `price_cents` | `INTEGER` | Unit price in minor units (≥ 0) |
| `currency` | `CHAR(3)` | ISO-4217 code (default `USD`) |
| `category` | `VARCHAR(100)` | Catalog grouping |
| `is_active` | `BOOLEAN` | Visibility flag |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | Audit timestamps |

**Indexes:** `sku`, `category`, `is_active`, `name`

### `inventory`

Per-product stock levels (one row per product).

| Column | Type | Purpose |
|--------|------|---------|
| `id` | `UUID` PK | Surrogate key |
| `product_id` | `UUID` FK → `products` UK | Owned product |
| `quantity_on_hand` | `INTEGER` | Physical stock (≥ 0) |
| `quantity_reserved` | `INTEGER` | Held for open carts/orders |
| `reorder_threshold` | `INTEGER` | Low-stock alert level |
| `warehouse_location` | `VARCHAR(100)` | Bin / warehouse code |
| `updated_at` | `TIMESTAMPTZ` | Last stock change |

**Constraints:** `quantity_reserved <= quantity_on_hand`

### `orders`

Customer purchase headers.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | `UUID` PK | Surrogate key |
| `user_id` | `UUID` FK → `users` | Purchaser |
| `status` | `order_status` | Lifecycle state |
| `total_cents` | `INTEGER` | Order total in minor units |
| `currency` | `CHAR(3)` | ISO-4217 |
| `shipping_address_*` | various | Ship-to address |
| `placed_at` / `updated_at` | `TIMESTAMPTZ` | Timing |

**Indexes:** `user_id`, `status`, `placed_at`

### `order_items`

Line items linking an order to products at the purchased unit price.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | `UUID` PK | Surrogate key |
| `order_id` | `UUID` FK → `orders` | Parent order |
| `product_id` | `UUID` FK → `products` | Purchased product |
| `quantity` | `INTEGER` | Units (> 0) |
| `unit_price_cents` | `INTEGER` | Price snapshot at purchase |
| `created_at` | `TIMESTAMPTZ` | Insert time |

**Unique:** (`order_id`, `product_id`)

### `audit_logs`

Append-oriented change / security event trail for compliance and debugging.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | `UUID` PK | Surrogate key |
| `entity_type` | `VARCHAR(64)` | Logical entity name |
| `entity_id` | `UUID` | Target row id |
| `action` | `audit_action` | Event kind |
| `actor_user_id` | `UUID` FK → `users` | Who performed the action |
| `changes` | `JSONB` | Before/after or metadata |
| `ip_address` | `INET` | Client address |
| `user_agent` | `TEXT` | Client UA string |
| `created_at` | `TIMESTAMPTZ` | Event time |

**Indexes:** (`entity_type`, `entity_id`), `actor_user_id`, `action`, `created_at`

---

## Repository layout

```
migrations/                 # Versioned up/down TypeScript migrations
  1740000000001_create-core-schema.ts
  1740000000002_seed-demo-data.ts
db/
  schema.sql                # Reference DDL (docs / review)
  seeds/001_demo_data.sql   # Standalone SQL seed (optional)
src/schema/models.ts        # TypeScript ORM-facing type mappings
docs/
  schema.md                 # This file
  images/er-diagram.png     # ER diagram
scripts/
  verify-migrations.ts      # Ephemeral DB dry-run (up/down/seed)
  verify-sql-syntax.ts      # Static SQL / migration lint
```

---

## Migration usage

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local/dev)
- Copy `.env.example` → `.env` and set `DATABASE_URL`

```bash
cp .env.example .env
npm install
```

### Apply migrations (human / CI against a non-production DB)

```bash
# Apply all pending migrations (schema + seed)
npm run migrate:up
```

Equivalent:

```bash
npx node-pg-migrate up
```

### Check status

```bash
npx node-pg-migrate status
```

### Create a new migration

```bash
npm run migrate:create -- add-some-column
```

### Seed data

Seed data ships as migration `1740000000002_seed-demo-data.ts` and runs automatically with `migrate:up` on a fresh database.

It inserts:

- 3 demo users (admin + 2 customers) with **bcrypt** password hashes
- **12** products and matching inventory rows
- 1 sample paid order with line items and audit log entries

Standalone SQL (optional):

```bash
psql "$DATABASE_URL" -f db/seeds/001_demo_data.sql
```

**Demo passphrase** (local only): `password`  
Hash algorithm: bcrypt cost 10. Replace before any shared or production environment. Never commit real credentials.

---

## Rolling back migrations

Migrations are reversible. Each file exports a `down()` that undoes `up()`.

### Roll back the latest migration

```bash
npm run migrate:down
```

### Roll back N migrations

```bash
npx node-pg-migrate down 2
```

### Full rollback (schema + seed)

```bash
npx node-pg-migrate down 2
# or repeatedly until status is empty
```

After a full down:

1. `users`, `products`, `inventory`, `orders`, `order_items`, `audit_logs` are dropped
2. Enum types `user_role`, `order_status`, `audit_action` are dropped
3. Seed rows are removed when only the seed migration is rolled back

**Caution:** Rolling back the schema migration destroys data in those tables. Prefer forward-fix migrations in shared environments. Production apply/rollback requires explicit human approval.

---

## Verification (read-only / ephemeral)

Do **not** run migrate against live configured databases from automation. Use:

```bash
# TypeScript compile + static SQL lint
npm run typecheck
npm run verify:sql

# Dry-run against ephemeral local PostgreSQL only
VERIFY_DATABASE_URL=postgres://ecommerce:ecommerce_ephemeral@127.0.0.1:5432/ecommerce_verify \
  npm run verify
```

The verify script resets an ephemeral local schema, applies up, asserts seed counts, runs down, and re-applies. It refuses non-localhost URLs.

---

## Reference DDL

See [`db/schema.sql`](../db/schema.sql) for a consolidated PostgreSQL DDL mirror of the TypeScript migrations (documentation and static review only).
