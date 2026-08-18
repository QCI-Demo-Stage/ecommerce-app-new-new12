import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

/**
 * Demo seed data for a fresh database.
 * Passwords are stored only as bcrypt hashes (never plaintext).
 */
const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgres://ecommerce:ecommerce_dev@127.0.0.1:5432/ecommerce_dev';

const DEMO_PASSWORD = 'ChangeMe-DemoOnly-1!';

interface ProductSeed {
  sku: string;
  name: string;
  description: string;
  price: string;
  category: string;
  quantity: number;
  reserved_quantity: number;
  warehouse_location: string;
}

const PRODUCTS: ProductSeed[] = [
  {
    sku: 'SKU-1001',
    name: 'Wireless Noise-Cancelling Headphones',
    description: 'Over-ear Bluetooth headphones with active noise cancellation.',
    price: '249.99',
    category: 'electronics',
    quantity: 120,
    reserved_quantity: 5,
    warehouse_location: 'WH-A-01',
  },
  {
    sku: 'SKU-1002',
    name: 'Mechanical Keyboard',
    description: 'Hot-swappable mechanical keyboard with RGB backlight.',
    price: '129.00',
    category: 'electronics',
    quantity: 80,
    reserved_quantity: 2,
    warehouse_location: 'WH-A-02',
  },
  {
    sku: 'SKU-1003',
    name: 'USB-C Hub 7-in-1',
    description: 'Multiport adapter with HDMI, USB-A, SD, and power delivery.',
    price: '59.95',
    category: 'electronics',
    quantity: 200,
    reserved_quantity: 10,
    warehouse_location: 'WH-A-03',
  },
  {
    sku: 'SKU-2001',
    name: 'Organic Cotton T-Shirt',
    description: 'Soft unisex tee made from certified organic cotton.',
    price: '29.50',
    category: 'apparel',
    quantity: 350,
    reserved_quantity: 15,
    warehouse_location: 'WH-B-01',
  },
  {
    sku: 'SKU-2002',
    name: 'Trail Running Shoes',
    description: 'Lightweight trail shoes with reinforced toe cap.',
    price: '119.00',
    category: 'apparel',
    quantity: 95,
    reserved_quantity: 4,
    warehouse_location: 'WH-B-02',
  },
  {
    sku: 'SKU-2003',
    name: 'Packable Rain Jacket',
    description: 'Waterproof shell that packs into its own pocket.',
    price: '89.00',
    category: 'apparel',
    quantity: 140,
    reserved_quantity: 0,
    warehouse_location: 'WH-B-03',
  },
  {
    sku: 'SKU-3001',
    name: 'Ceramic Pour-Over Set',
    description: 'Two-cup pour-over dripper with matching carafe.',
    price: '42.00',
    category: 'home',
    quantity: 75,
    reserved_quantity: 3,
    warehouse_location: 'WH-C-01',
  },
  {
    sku: 'SKU-3002',
    name: 'Cast Iron Skillet 12"',
    description: 'Pre-seasoned skillet suitable for stove and oven use.',
    price: '54.99',
    category: 'home',
    quantity: 60,
    reserved_quantity: 1,
    warehouse_location: 'WH-C-02',
  },
  {
    sku: 'SKU-3003',
    name: 'Bamboo Cutting Board',
    description: 'Extra-large reversible bamboo board with juice groove.',
    price: '34.00',
    category: 'home',
    quantity: 110,
    reserved_quantity: 6,
    warehouse_location: 'WH-C-03',
  },
  {
    sku: 'SKU-4001',
    name: 'Yoga Mat Pro',
    description: 'Non-slip 5mm mat with alignment markers.',
    price: '48.00',
    category: 'fitness',
    quantity: 160,
    reserved_quantity: 8,
    warehouse_location: 'WH-D-01',
  },
  {
    sku: 'SKU-4002',
    name: 'Adjustable Dumbbell Pair',
    description: 'Pair of adjustable dumbbells from 5–25 lb each.',
    price: '199.00',
    category: 'fitness',
    quantity: 40,
    reserved_quantity: 2,
    warehouse_location: 'WH-D-02',
  },
  {
    sku: 'SKU-4003',
    name: 'Insulated Water Bottle 32oz',
    description: 'Double-wall stainless steel bottle keeps drinks cold 24h.',
    price: '32.00',
    category: 'fitness',
    quantity: 220,
    reserved_quantity: 12,
    warehouse_location: 'WH-D-03',
  },
];

async function seed(): Promise<void> {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    const usersResult = await client.query<{ id: string; email: string }>(
      `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES
        ($1, $2, 'Ada', 'Admin', 'admin'),
        ($3, $2, 'Casey', 'Customer', 'customer'),
        ($4, $2, 'Sam', 'Support', 'support')
      ON CONFLICT (email) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            updated_at = NOW()
      RETURNING id, email
      `,
      [
        'admin@example.com',
        passwordHash,
        'customer@example.com',
        'support@example.com',
      ],
    );

    const adminId = usersResult.rows.find((u) => u.email === 'admin@example.com')?.id;

    for (const product of PRODUCTS) {
      const productResult = await client.query<{ id: string }>(
        `
        INSERT INTO products (sku, name, description, price, category, is_active)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        ON CONFLICT (sku) DO UPDATE
          SET name = EXCLUDED.name,
              description = EXCLUDED.description,
              price = EXCLUDED.price,
              category = EXCLUDED.category,
              is_active = TRUE,
              updated_at = NOW()
        RETURNING id
        `,
        [
          product.sku,
          product.name,
          product.description,
          product.price,
          product.category,
        ],
      );

      const productId = productResult.rows[0].id;

      await client.query(
        `
        INSERT INTO inventory (
          product_id, quantity, reserved_quantity, warehouse_location
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (product_id) DO UPDATE
          SET quantity = EXCLUDED.quantity,
              reserved_quantity = EXCLUDED.reserved_quantity,
              warehouse_location = EXCLUDED.warehouse_location,
              updated_at = NOW()
        `,
        [
          productId,
          product.quantity,
          product.reserved_quantity,
          product.warehouse_location,
        ],
      );
    }

    if (adminId) {
      await client.query(
        `
        INSERT INTO audit_logs (entity_type, entity_id, action, actor_id, changes, metadata)
        VALUES (
          'seed',
          $1,
          'db.seed',
          $1,
          '{"products": 12, "users": 3}'::jsonb,
          '{"source": "seeds/seed.ts"}'::jsonb
        )
        `,
        [adminId],
      );
    }

    await client.query('COMMIT');

    const counts = await client.query<{
      users: string;
      products: string;
      inventory: string;
    }>(
      `
      SELECT
        (SELECT COUNT(*)::text FROM users) AS users,
        (SELECT COUNT(*)::text FROM products) AS products,
        (SELECT COUNT(*)::text FROM inventory) AS inventory
      `,
    );

    console.log('Seed completed successfully.');
    console.log(
      `Users: ${counts.rows[0].users}, Products: ${counts.rows[0].products}, Inventory: ${counts.rows[0].inventory}`,
    );
    console.log(
      'Demo accounts use bcrypt-hashed passwords. See .env.example for DB connection; rotate demo credentials before any shared environment.',
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

void seed();
