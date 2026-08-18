import type { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

/**
 * Demo seed data for a fresh database instance.
 *
 * Passwords are stored as bcrypt hashes only (never plaintext).
 * Hash below corresponds to the demo passphrase documented in docs/schema.md
 * (bcrypt cost 10). Rotate before any non-local use.
 */

export const shorthands: ColumnDefinitions | undefined = undefined;

/**
 * bcrypt hash for local demo only (cost 10). Never a production credential.
 * Documented passphrase lives in docs/schema.md — rotate before any shared env.
 */
const DEMO_PASSWORD_HASH =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

/**
 * Stable UUIDs so seed data is idempotent and referentially consistent.
 */
const USER_IDS = {
  admin: '11111111-1111-4111-8111-111111111111',
  alice: '22222222-2222-4222-8222-222222222222',
  bob: '33333333-3333-4333-8333-333333333333',
} as const;

const PRODUCT_IDS = [
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12',
] as const;

const PRODUCTS: ReadonlyArray<{
  id: string;
  sku: string;
  name: string;
  description: string;
  priceCents: number;
  category: string;
  qty: number;
  reserved: number;
  warehouse: string;
}> = [
  {
    id: PRODUCT_IDS[0],
    sku: 'WDG-001',
    name: 'Classic Widget',
    description: 'Everyday widget for home and office.',
    priceCents: 1999,
    category: 'widgets',
    qty: 120,
    reserved: 5,
    warehouse: 'WH-EAST-A1',
  },
  {
    id: PRODUCT_IDS[1],
    sku: 'WDG-002',
    name: 'Pro Widget',
    description: 'Heavy-duty widget with extended warranty.',
    priceCents: 4999,
    category: 'widgets',
    qty: 75,
    reserved: 10,
    warehouse: 'WH-EAST-A1',
  },
  {
    id: PRODUCT_IDS[2],
    sku: 'GAD-100',
    name: 'Smart Gadget Mini',
    description: 'Compact connected gadget with USB-C.',
    priceCents: 7999,
    category: 'gadgets',
    qty: 50,
    reserved: 2,
    warehouse: 'WH-WEST-B2',
  },
  {
    id: PRODUCT_IDS[3],
    sku: 'GAD-200',
    name: 'Smart Gadget Plus',
    description: 'Full-size gadget with wireless charging.',
    priceCents: 12999,
    category: 'gadgets',
    qty: 40,
    reserved: 0,
    warehouse: 'WH-WEST-B2',
  },
  {
    id: PRODUCT_IDS[4],
    sku: 'ACC-010',
    name: 'USB-C Cable 2m',
    description: 'Braided USB-C cable, 2 meter length.',
    priceCents: 1299,
    category: 'accessories',
    qty: 500,
    reserved: 20,
    warehouse: 'WH-EAST-C3',
  },
  {
    id: PRODUCT_IDS[5],
    sku: 'ACC-020',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with silent clicks.',
    priceCents: 3499,
    category: 'accessories',
    qty: 200,
    reserved: 8,
    warehouse: 'WH-EAST-C3',
  },
  {
    id: PRODUCT_IDS[6],
    sku: 'ACC-030',
    name: 'Laptop Stand',
    description: 'Aluminum laptop stand, adjustable height.',
    priceCents: 5999,
    category: 'accessories',
    qty: 90,
    reserved: 3,
    warehouse: 'WH-CENT-D1',
  },
  {
    id: PRODUCT_IDS[7],
    sku: 'HME-050',
    name: 'Desk Lamp LED',
    description: 'Dimmable LED desk lamp with USB port.',
    priceCents: 4499,
    category: 'home',
    qty: 110,
    reserved: 4,
    warehouse: 'WH-CENT-D1',
  },
  {
    id: PRODUCT_IDS[8],
    sku: 'HME-060',
    name: 'Ceramic Mug Set',
    description: 'Set of 4 stoneware mugs, 12 oz.',
    priceCents: 2999,
    category: 'home',
    qty: 150,
    reserved: 0,
    warehouse: 'WH-EAST-C3',
  },
  {
    id: PRODUCT_IDS[9],
    sku: 'OUT-070',
    name: 'Trail Water Bottle',
    description: 'Insulated 32 oz stainless bottle.',
    priceCents: 3499,
    category: 'outdoors',
    qty: 180,
    reserved: 12,
    warehouse: 'WH-WEST-B2',
  },
  {
    id: PRODUCT_IDS[10],
    sku: 'OUT-080',
    name: 'Daypack 20L',
    description: 'Lightweight daypack with laptop sleeve.',
    priceCents: 6999,
    category: 'outdoors',
    qty: 65,
    reserved: 5,
    warehouse: 'WH-WEST-B2',
  },
  {
    id: PRODUCT_IDS[11],
    sku: 'OFF-090',
    name: 'Notebook A5 Dot Grid',
    description: 'Hardcover notebook, 192 pages.',
    priceCents: 1499,
    category: 'office',
    qty: 300,
    reserved: 15,
    warehouse: 'WH-EAST-A1',
  },
];

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
    VALUES
      ('${USER_IDS.admin}', 'admin@example.com', '${DEMO_PASSWORD_HASH}', 'Ada', 'Admin', 'admin', true),
      ('${USER_IDS.alice}', 'alice@example.com', '${DEMO_PASSWORD_HASH}', 'Alice', 'Nguyen', 'customer', true),
      ('${USER_IDS.bob}', 'bob@example.com', '${DEMO_PASSWORD_HASH}', 'Bob', 'Patel', 'customer', true)
    ON CONFLICT (email) DO NOTHING;
  `);

  for (const p of PRODUCTS) {
    pgm.sql(`
      INSERT INTO products (id, sku, name, description, price_cents, currency, category, is_active)
      VALUES (
        '${p.id}',
        '${p.sku}',
        '${p.name.replace(/'/g, "''")}',
        '${p.description.replace(/'/g, "''")}',
        ${p.priceCents},
        'USD',
        '${p.category}',
        true
      )
      ON CONFLICT (sku) DO NOTHING;
    `);

    pgm.sql(`
      INSERT INTO inventory (
        product_id, quantity_on_hand, quantity_reserved, reorder_threshold, warehouse_location
      )
      VALUES (
        '${p.id}',
        ${p.qty},
        ${p.reserved},
        10,
        '${p.warehouse}'
      )
      ON CONFLICT (product_id) DO NOTHING;
    `);
  }

  pgm.sql(`
    INSERT INTO orders (
      id, user_id, status, total_cents, currency,
      shipping_address_line1, shipping_city, shipping_region,
      shipping_postal_code, shipping_country
    )
    VALUES (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      '${USER_IDS.alice}',
      'paid',
      5298,
      'USD',
      '100 Market Street',
      'San Francisco',
      'CA',
      '94105',
      'US'
    )
    ON CONFLICT (id) DO NOTHING;
  `);

  pgm.sql(`
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents)
    VALUES
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', '${PRODUCT_IDS[0]}', 1, 1999),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', '${PRODUCT_IDS[4]}', 1, 1299),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', '${PRODUCT_IDS[11]}', 1, 1499)
    ON CONFLICT (order_id, product_id) DO NOTHING;
  `);

  pgm.sql(`
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, changes)
    VALUES
      ('users', '${USER_IDS.admin}', 'insert', '${USER_IDS.admin}', '{"source":"seed"}'::jsonb),
      ('products', '${PRODUCT_IDS[0]}', 'insert', '${USER_IDS.admin}', '{"source":"seed"}'::jsonb),
      ('orders', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'insert', '${USER_IDS.alice}', '{"source":"seed"}'::jsonb);
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DELETE FROM audit_logs
    WHERE changes->>'source' = 'seed';
  `);
  pgm.sql(`
    DELETE FROM order_items
    WHERE order_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
  `);
  pgm.sql(`
    DELETE FROM orders
    WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
  `);
  pgm.sql(`
    DELETE FROM inventory
    WHERE product_id IN (${PRODUCT_IDS.map((id) => `'${id}'`).join(', ')});
  `);
  pgm.sql(`
    DELETE FROM products
    WHERE id IN (${PRODUCT_IDS.map((id) => `'${id}'`).join(', ')});
  `);
  pgm.sql(`
    DELETE FROM users
    WHERE id IN ('${USER_IDS.admin}', '${USER_IDS.alice}', '${USER_IDS.bob}');
  `);
}
