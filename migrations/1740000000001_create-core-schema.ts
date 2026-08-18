import type { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

/**
 * Core ecommerce schema: users, products, inventory, orders (+ order_items),
 * and audit_logs. Fully reversible via the down() migration.
 */

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension('pgcrypto', { ifNotExists: true });
  pgm.createExtension('citext', { ifNotExists: true });

  pgm.createType('user_role', ['customer', 'admin', 'support']);
  pgm.createType('order_status', [
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]);
  pgm.createType('audit_action', [
    'insert',
    'update',
    'delete',
    'login',
    'logout',
    'status_change',
  ]);

  // -------------------------------------------------------------------------
  // users
  // -------------------------------------------------------------------------
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: { type: 'citext', notNull: true },
    password_hash: { type: 'text', notNull: true },
    first_name: { type: 'varchar(100)', notNull: true },
    last_name: { type: 'varchar(100)', notNull: true },
    role: {
      type: 'user_role',
      notNull: true,
      default: 'customer',
    },
    is_active: { type: 'boolean', notNull: true, default: true },
    last_login_at: { type: 'timestamptz' },
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

  pgm.addConstraint('users', 'users_email_unique', {
    unique: ['email'],
  });
  pgm.createIndex('users', 'email', { name: 'idx_users_email' });
  pgm.createIndex('users', 'role', { name: 'idx_users_role' });
  pgm.createIndex('users', 'is_active', { name: 'idx_users_is_active' });

  // -------------------------------------------------------------------------
  // products
  // -------------------------------------------------------------------------
  pgm.createTable('products', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    sku: { type: 'varchar(64)', notNull: true },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    price_cents: { type: 'integer', notNull: true },
    currency: { type: 'char(3)', notNull: true, default: 'USD' },
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

  pgm.addConstraint('products', 'products_sku_unique', {
    unique: ['sku'],
  });
  pgm.addConstraint('products', 'products_price_cents_nonnegative', {
    check: 'price_cents >= 0',
  });
  pgm.createIndex('products', 'sku', { name: 'idx_products_sku' });
  pgm.createIndex('products', 'category', { name: 'idx_products_category' });
  pgm.createIndex('products', 'is_active', { name: 'idx_products_is_active' });
  pgm.createIndex('products', 'name', { name: 'idx_products_name' });

  // -------------------------------------------------------------------------
  // inventory (1:1 with products)
  // -------------------------------------------------------------------------
  pgm.createTable('inventory', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    product_id: {
      type: 'uuid',
      notNull: true,
      references: 'products',
      onDelete: 'CASCADE',
    },
    quantity_on_hand: { type: 'integer', notNull: true, default: 0 },
    quantity_reserved: { type: 'integer', notNull: true, default: 0 },
    reorder_threshold: { type: 'integer', notNull: true, default: 10 },
    warehouse_location: { type: 'varchar(100)' },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.addConstraint('inventory', 'inventory_product_id_unique', {
    unique: ['product_id'],
  });
  pgm.addConstraint('inventory', 'inventory_quantity_on_hand_nonnegative', {
    check: 'quantity_on_hand >= 0',
  });
  pgm.addConstraint('inventory', 'inventory_quantity_reserved_nonnegative', {
    check: 'quantity_reserved >= 0',
  });
  pgm.addConstraint('inventory', 'inventory_reserved_lte_on_hand', {
    check: 'quantity_reserved <= quantity_on_hand',
  });
  pgm.createIndex('inventory', 'product_id', {
    name: 'idx_inventory_product_id',
  });
  pgm.createIndex('inventory', 'warehouse_location', {
    name: 'idx_inventory_warehouse_location',
  });

  // -------------------------------------------------------------------------
  // orders
  // -------------------------------------------------------------------------
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
      type: 'order_status',
      notNull: true,
      default: 'pending',
    },
    total_cents: { type: 'integer', notNull: true, default: 0 },
    currency: { type: 'char(3)', notNull: true, default: 'USD' },
    shipping_address_line1: { type: 'varchar(255)', notNull: true },
    shipping_address_line2: { type: 'varchar(255)' },
    shipping_city: { type: 'varchar(100)', notNull: true },
    shipping_region: { type: 'varchar(100)' },
    shipping_postal_code: { type: 'varchar(32)', notNull: true },
    shipping_country: { type: 'char(2)', notNull: true, default: 'US' },
    placed_at: {
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

  pgm.addConstraint('orders', 'orders_total_cents_nonnegative', {
    check: 'total_cents >= 0',
  });
  pgm.createIndex('orders', 'user_id', { name: 'idx_orders_user_id' });
  pgm.createIndex('orders', 'status', { name: 'idx_orders_status' });
  pgm.createIndex('orders', 'placed_at', { name: 'idx_orders_placed_at' });

  // -------------------------------------------------------------------------
  // order_items (line items linking orders ↔ products)
  // -------------------------------------------------------------------------
  pgm.createTable('order_items', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    order_id: {
      type: 'uuid',
      notNull: true,
      references: 'orders',
      onDelete: 'CASCADE',
    },
    product_id: {
      type: 'uuid',
      notNull: true,
      references: 'products',
      onDelete: 'RESTRICT',
    },
    quantity: { type: 'integer', notNull: true },
    unit_price_cents: { type: 'integer', notNull: true },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.addConstraint('order_items', 'order_items_quantity_positive', {
    check: 'quantity > 0',
  });
  pgm.addConstraint('order_items', 'order_items_unit_price_nonnegative', {
    check: 'unit_price_cents >= 0',
  });
  pgm.createIndex('order_items', 'order_id', {
    name: 'idx_order_items_order_id',
  });
  pgm.createIndex('order_items', 'product_id', {
    name: 'idx_order_items_product_id',
  });
  pgm.addConstraint('order_items', 'order_items_order_product_unique', {
    unique: ['order_id', 'product_id'],
  });

  // -------------------------------------------------------------------------
  // audit_logs (append-only style; no UPDATE/DELETE FKs that cascade away)
  // -------------------------------------------------------------------------
  pgm.createTable('audit_logs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    entity_type: { type: 'varchar(64)', notNull: true },
    entity_id: { type: 'uuid', notNull: true },
    action: { type: 'audit_action', notNull: true },
    actor_user_id: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    changes: { type: 'jsonb', notNull: true, default: pgm.func("'{}'::jsonb") },
    ip_address: { type: 'inet' },
    user_agent: { type: 'text' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('audit_logs', ['entity_type', 'entity_id'], {
    name: 'idx_audit_logs_entity',
  });
  pgm.createIndex('audit_logs', 'actor_user_id', {
    name: 'idx_audit_logs_actor_user_id',
  });
  pgm.createIndex('audit_logs', 'action', { name: 'idx_audit_logs_action' });
  pgm.createIndex('audit_logs', 'created_at', {
    name: 'idx_audit_logs_created_at',
  });

  // updated_at trigger helper
  pgm.createFunction(
    'set_updated_at',
    [],
    {
      returns: 'trigger',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    `,
  );

  for (const table of ['users', 'products', 'orders'] as const) {
    pgm.createTrigger(table, `${table}_set_updated_at`, {
      when: 'BEFORE',
      operation: 'UPDATE',
      level: 'ROW',
      function: 'set_updated_at',
    });
  }

  pgm.createTrigger('inventory', 'inventory_set_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'set_updated_at',
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTrigger('inventory', 'inventory_set_updated_at', { ifExists: true });
  for (const table of ['orders', 'products', 'users'] as const) {
    pgm.dropTrigger(table, `${table}_set_updated_at`, { ifExists: true });
  }
  pgm.dropFunction('set_updated_at', [], { ifExists: true });

  pgm.dropTable('audit_logs', { ifExists: true, cascade: true });
  pgm.dropTable('order_items', { ifExists: true, cascade: true });
  pgm.dropTable('orders', { ifExists: true, cascade: true });
  pgm.dropTable('inventory', { ifExists: true, cascade: true });
  pgm.dropTable('products', { ifExists: true, cascade: true });
  pgm.dropTable('users', { ifExists: true, cascade: true });

  pgm.dropType('audit_action', { ifExists: true });
  pgm.dropType('order_status', { ifExists: true });
  pgm.dropType('user_role', { ifExists: true });
}
