-- Reference DDL for payment tokenization (PostgreSQL 14+).
-- Authoritative reversible migrations live in /migrations (node-pg-migrate).
-- This file is for documentation and static SQL review only.
-- NEVER stores PAN, CVV, track data, or plaintext payment method secrets.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE payment_provider AS ENUM ('stripe', 'paypal');

-- Payment-domain customers (provider customer ids). Linked optionally to app users
-- via metadata in the application layer; no raw card data is stored here.
CREATE TABLE customers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 CITEXT NOT NULL,
  display_name          VARCHAR(255),
  provider              payment_provider NOT NULL,
  provider_customer_id  VARCHAR(255) NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customers_provider_customer_unique UNIQUE (provider, provider_customer_id)
);

CREATE INDEX idx_customers_email ON customers (email);
CREATE INDEX idx_customers_provider ON customers (provider);

-- Tokenized payment methods only: ciphertext from simulated/application KMS.
-- Columns match the payment tokens story contract.
CREATE TABLE payment_tokens (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      UUID NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  token_encrypted  TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX payment_tokens_token_encrypted_uidx
  ON payment_tokens (token_encrypted);

CREATE INDEX idx_payment_tokens_customer_id
  ON payment_tokens (customer_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER customers_set_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER payment_tokens_set_updated_at
  BEFORE UPDATE ON payment_tokens
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
