import type { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate";

/**
 * Payment domain schema: customers + payment_tokens.
 *
 * Stores ONLY KMS-encrypted payment method tokens — never PAN, CVV, or
 * track data. Aligns with PCI-DSS SAQ A / tokenization guidance.
 *
 * READ-ONLY AUTHORING: do not apply this migration from CI/agent without
 * explicit human approval. Use migrate:up plan/dry-run locally first.
 */

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension("pgcrypto", { ifNotExists: true });
  pgm.createExtension("citext", { ifNotExists: true });

  // -------------------------------------------------------------------------
  // customers — payment-domain customer records (FK target for payment_tokens)
  // -------------------------------------------------------------------------
  pgm.createTable("customers", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    email: { type: "citext", notNull: true },
    name: { type: "varchar(200)" },
    provider: { type: "varchar(32)", notNull: true },
    provider_customer_id: { type: "varchar(128)", notNull: true },
    user_id: { type: "uuid" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.addConstraint("customers", "customers_provider_check", {
    check: "provider IN ('stripe', 'paypal')",
  });

  pgm.addConstraint("customers", "customers_email_provider_unique", {
    unique: ["email", "provider"],
  });

  pgm.createIndex("customers", "email", {
    name: "idx_customers_email",
  });
  pgm.createIndex("customers", "provider_customer_id", {
    name: "idx_customers_provider_customer_id",
  });

  // -------------------------------------------------------------------------
  // payment_tokens — encrypted provider tokens only
  // Columns: id, customer_id, token_encrypted, created_at, updated_at
  // -------------------------------------------------------------------------
  pgm.createTable("payment_tokens", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    customer_id: {
      type: "uuid",
      notNull: true,
      references: "customers",
      onDelete: "CASCADE",
    },
    token_encrypted: {
      type: "text",
      notNull: true,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.sql(`
    COMMENT ON COLUMN payment_tokens.token_encrypted IS
      'AES-256-GCM ciphertext from KMS (iv || tag || ciphertext), base64-encoded. Never plaintext.';
  `);

  // Unique index on encrypted token material (dedupe / integrity)
  pgm.createIndex("payment_tokens", "token_encrypted", {
    name: "idx_payment_tokens_token_encrypted_unique",
    unique: true,
  });

  pgm.createIndex("payment_tokens", "customer_id", {
    name: "idx_payment_tokens_customer_id",
  });

  // Audit: auto-maintain updated_at
  pgm.sql(`
    CREATE OR REPLACE FUNCTION payment_set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    DROP TRIGGER IF EXISTS trg_customers_set_updated_at ON customers;
    CREATE TRIGGER trg_customers_set_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION payment_set_updated_at();
  `);

  pgm.sql(`
    DROP TRIGGER IF EXISTS trg_payment_tokens_set_updated_at ON payment_tokens;
    CREATE TRIGGER trg_payment_tokens_set_updated_at
    BEFORE UPDATE ON payment_tokens
    FOR EACH ROW
    EXECUTE FUNCTION payment_set_updated_at();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    "DROP TRIGGER IF EXISTS trg_payment_tokens_set_updated_at ON payment_tokens;",
  );
  pgm.sql("DROP TRIGGER IF EXISTS trg_customers_set_updated_at ON customers;");
  pgm.sql("DROP FUNCTION IF EXISTS payment_set_updated_at();");

  pgm.dropTable("payment_tokens", { ifExists: true, cascade: true });
  pgm.dropTable("customers", { ifExists: true, cascade: true });
}
