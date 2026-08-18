import type { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

/**
 * Core ecommerce schema:
 * users, products, inventory, orders, audit_logs
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    first_name: { type: 'varchar(100)', notNull: true },
    last_name: { type: 'varchar(100)', notNull: true },
    role: {
      type: 'varchar(32)',
      notNull: true,
      default: 'customer',
    },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.addConstraint('users', 'users_role_check', {
    check: "role IN ('customer', 'admin', 'support')",
  });
  pgm.createIndex('users', 'email', { name: 'idx_users_email' });
  pgm.createIndex('users', 'role', { name: 'idx_users_role' });

  pgm.createTable('products', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    sku: { type: 'varchar(64)', notNull: true, unique: true },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    price: { type: 'numeric(12, 2)', notNull: true },
    category: { type: 'varchar(100)' },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.addConstraint('products', 'products_price_non_negative', {
    check: 'price >= 0',
  });
  pgm.createIndex('products', 'sku', { name: 'idx_products_sku' });
  pgm.createIndex('products', 'category', { name: 'idx_products_category' });
  pgm.createIndex('products', 'name', { name: 'idx_products_name' });
  pgm.createIndex('products', 'is_active', { name: 'idx_products_is_active' });

  pgm.createTable('inventory', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    product_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
      references: 'products',
      onDelete: 'CASCADE',
    },
    quantity: { type: 'integer', notNull: true, default: 0 },
    reserved_quantity: { type: 'integer', notNull: true, default: 0 },
    warehouse_location: { type: 'varchar(100)' },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.addConstraint('inventory', 'inventory_quantity_non_negative', {
    check: 'quantity >= 0',
  });
  pgm.addConstraint('inventory', 'inventory_reserved_non_negative', {
    check: 'reserved_quantity >= 0',
  });
  pgm.addConstraint('inventory', 'inventory_reserved_lte_quantity', {
    check: 'reserved_quantity <= quantity',
  });
  pgm.createIndex('inventory', 'product_id', {
    name: 'idx_inventory_product_id',
  });
  pgm.createIndex('inventory', 'warehouse_location', {
    name: 'idx_inventory_warehouse_location',
  });

  pgm.createTable('orders', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'RESTRICT',
    },
    status: {
      type: 'varchar(32)',
      notNull: true,
      default: 'pending',
    },
    total_amount: { type: 'numeric(12, 2)', notNull: true },
    currency: { type: 'char(3)', notNull: true, default: 'USD' },
    items: { type: 'jsonb', notNull: true, default: pgm.func("'[]'::jsonb") },
    shipping_address: { type: 'jsonb' },
    notes: { type: 'text' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.addConstraint('orders', 'orders_status_check', {
    check:
      "status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')",
  });
  pgm.addConstraint('orders', 'orders_total_amount_non_negative', {
    check: 'total_amount >= 0',
  });
  pgm.createIndex('orders', 'user_id', { name: 'idx_orders_user_id' });
  pgm.createIndex('orders', 'status', { name: 'idx_orders_status' });
  pgm.createIndex('orders', 'created_at', { name: 'idx_orders_created_at' });
  pgm.createIndex('orders', 'items', {
    name: 'idx_orders_items_gin',
    method: 'gin',
  });

  pgm.createTable('audit_logs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    entity_type: { type: 'varchar(64)', notNull: true },
    entity_id: { type: 'uuid', notNull: true },
    action: { type: 'varchar(64)', notNull: true },
    actor_id: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    changes: { type: 'jsonb' },
    metadata: { type: 'jsonb' },
    ip_address: { type: 'inet' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('audit_logs', ['entity_type', 'entity_id'], {
    name: 'idx_audit_logs_entity',
  });
  pgm.createIndex('audit_logs', 'actor_id', { name: 'idx_audit_logs_actor_id' });
  pgm.createIndex('audit_logs', 'action', { name: 'idx_audit_logs_action' });
  pgm.createIndex('audit_logs', 'created_at', {
    name: 'idx_audit_logs_created_at',
  });

  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  for (const table of ['users', 'products', 'orders'] as const) {
    pgm.sql(`
      CREATE TRIGGER trg_${table}_set_updated_at
      BEFORE UPDATE ON ${table}
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);
  }

  pgm.sql(`
    CREATE TRIGGER trg_inventory_set_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('DROP TRIGGER IF EXISTS trg_inventory_set_updated_at ON inventory;');
  pgm.sql('DROP TRIGGER IF EXISTS trg_orders_set_updated_at ON orders;');
  pgm.sql('DROP TRIGGER IF EXISTS trg_products_set_updated_at ON products;');
  pgm.sql('DROP TRIGGER IF EXISTS trg_users_set_updated_at ON users;');
  pgm.sql('DROP FUNCTION IF EXISTS set_updated_at();');

  pgm.dropTable('audit_logs', { ifExists: true, cascade: true });
  pgm.dropTable('orders', { ifExists: true, cascade: true });
  pgm.dropTable('inventory', { ifExists: true, cascade: true });
  pgm.dropTable('products', { ifExists: true, cascade: true });
  pgm.dropTable('users', { ifExists: true, cascade: true });
}
