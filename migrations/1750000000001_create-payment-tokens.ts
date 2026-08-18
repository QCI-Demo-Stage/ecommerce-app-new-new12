import type { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate";

/**
 * Payment tokenization schema: customers + payment_tokens.
 * Stores only KMS-encrypted provider tokens (PCI-DSS scope reduction).
 * Fully reversible via down().
 */

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension("pgcrypto", { ifNotExists: true });
  pgm.createExtension("citext", { ifNotExists: true });

  pgm.createType("payment_provider", ["stripe", "paypal"]);

  pgm.createTable("customers", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    email: { type: "citext", notNull: true },
    display_name: { type: "varchar(255)" },
    provider: { type: "payment_provider", notNull: true },
    provider_customer_id: { type: "varchar(255)", notNull: true },
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

  pgm.addConstraint("customers", "customers_provider_customer_unique", {
    unique: ["provider", "provider_customer_id"],
  });
  pgm.createIndex("customers", "email", { name: "idx_customers_email" });
  pgm.createIndex("customers", "provider", { name: "idx_customers_provider" });

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
    token_encrypted: { type: "text", notNull: true },
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

  pgm.createIndex("payment_tokens", "token_encrypted", {
    name: "payment_tokens_token_encrypted_uidx",
    unique: true,
  });
  pgm.createIndex("payment_tokens", "customer_id", {
    name: "idx_payment_tokens_customer_id",
  });

  // Ensure set_updated_at exists even when core schema migration is absent.
  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$;
  `);

  pgm.sql(`
    CREATE TRIGGER customers_set_updated_at
      BEFORE UPDATE ON customers
      FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
  `);

  pgm.sql(`
    CREATE TRIGGER payment_tokens_set_updated_at
      BEFORE UPDATE ON payment_tokens
      FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DROP TRIGGER IF EXISTS payment_tokens_set_updated_at ON payment_tokens;`);
  pgm.sql(`DROP TRIGGER IF EXISTS customers_set_updated_at ON customers;`);
  pgm.dropTable("payment_tokens");
  pgm.dropTable("customers");
  pgm.dropType("payment_provider");
}
