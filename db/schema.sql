-- Reference DDL for the Ecommerce App core schema (PostgreSQL 14+).
-- Authoritative reversible migrations live in /migrations (node-pg-migrate).
-- This file is for documentation and static SQL review only.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE user_role AS ENUM ('customer', 'admin', 'support');
CREATE TYPE order_status AS ENUM (
  'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
);
CREATE TYPE audit_action AS ENUM (
  'insert', 'update', 'delete', 'login', 'logout', 'status_change'
);

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           CITEXT NOT NULL,
  password_hash   TEXT NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  role            user_role NOT NULL DEFAULT 'customer',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_is_active ON users (is_active);

CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku             VARCHAR(64) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  price_cents     INTEGER NOT NULL,
  currency        CHAR(3) NOT NULL DEFAULT 'USD',
  category        VARCHAR(100),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_sku_unique UNIQUE (sku),
  CONSTRAINT products_price_cents_nonnegative CHECK (price_cents >= 0)
);

CREATE INDEX idx_products_sku ON products (sku);
CREATE INDEX idx_products_category ON products (category);
CREATE INDEX idx_products_is_active ON products (is_active);
CREATE INDEX idx_products_name ON products (name);

CREATE TABLE inventory (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  quantity_on_hand    INTEGER NOT NULL DEFAULT 0,
  quantity_reserved   INTEGER NOT NULL DEFAULT 0,
  reorder_threshold   INTEGER NOT NULL DEFAULT 10,
  warehouse_location  VARCHAR(100),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inventory_product_id_unique UNIQUE (product_id),
  CONSTRAINT inventory_quantity_on_hand_nonnegative CHECK (quantity_on_hand >= 0),
  CONSTRAINT inventory_quantity_reserved_nonnegative CHECK (quantity_reserved >= 0),
  CONSTRAINT inventory_reserved_lte_on_hand CHECK (quantity_reserved <= quantity_on_hand)
);

CREATE INDEX idx_inventory_product_id ON inventory (product_id);
CREATE INDEX idx_inventory_warehouse_location ON inventory (warehouse_location);

CREATE TABLE orders (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  status                  order_status NOT NULL DEFAULT 'pending',
  total_cents             INTEGER NOT NULL DEFAULT 0,
  currency                CHAR(3) NOT NULL DEFAULT 'USD',
  shipping_address_line1  VARCHAR(255) NOT NULL,
  shipping_address_line2  VARCHAR(255),
  shipping_city           VARCHAR(100) NOT NULL,
  shipping_region         VARCHAR(100),
  shipping_postal_code     VARCHAR(32) NOT NULL,
  shipping_country        CHAR(2) NOT NULL DEFAULT 'US',
  placed_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT orders_total_cents_nonnegative CHECK (total_cents >= 0)
);

CREATE INDEX idx_orders_user_id ON orders (user_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_placed_at ON orders (placed_at);

CREATE TABLE order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  quantity          INTEGER NOT NULL,
  unit_price_cents  INTEGER NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT order_items_unit_price_nonnegative CHECK (unit_price_cents >= 0),
  CONSTRAINT order_items_order_product_unique UNIQUE (order_id, product_id)
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     VARCHAR(64) NOT NULL,
  entity_id       UUID NOT NULL,
  action          audit_action NOT NULL,
  actor_user_id   UUID REFERENCES users (id) ON DELETE SET NULL,
  changes         JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs (actor_user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER inventory_set_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
