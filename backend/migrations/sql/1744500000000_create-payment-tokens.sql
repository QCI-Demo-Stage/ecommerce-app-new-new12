-- Read-only SQL reference for payment_tokens (mirrors the TypeScript migration).
-- DO NOT apply from automation without human approval.
-- Equivalent: backend/migrations/1744500000000_create-payment-tokens.ts

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL,
  name VARCHAR(200),
  provider VARCHAR(32) NOT NULL,
  provider_customer_id VARCHAR(128) NOT NULL,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customers_provider_check CHECK (provider IN ('stripe', 'paypal')),
  CONSTRAINT customers_email_provider_unique UNIQUE (email, provider)
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);
CREATE INDEX IF NOT EXISTS idx_customers_provider_customer_id
  ON customers (provider_customer_id);

CREATE TABLE IF NOT EXISTS payment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  -- AES-256-GCM ciphertext from KMS; never store plaintext tokens
  token_encrypted TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_tokens_token_encrypted_unique
  ON payment_tokens (token_encrypted);

CREATE INDEX IF NOT EXISTS idx_payment_tokens_customer_id
  ON payment_tokens (customer_id);
