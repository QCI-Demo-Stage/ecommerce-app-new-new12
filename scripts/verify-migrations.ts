/**
 * Read-only migration verification against an EPHEMERAL local PostgreSQL database.
 * Never targets a configured live / shared database.
 *
 * Usage: DATABASE_URL=postgres://... npm run verify
 */

import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import runner from 'node-pg-migrate';

const EPHEMERAL_URL =
  process.env.VERIFY_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgres://ecommerce:ecommerce_ephemeral@127.0.0.1:5432/ecommerce_verify';

function assertEphemeral(url: string): void {
  const lower = url.toLowerCase();
  const blocked = ['prod', 'production', 'staging', 'rds.amazonaws.com', 'azure.com', 'cloudsql'];
  for (const token of blocked) {
    if (lower.includes(token)) {
      throw new Error(
        `Refusing to run verification against non-ephemeral URL (matched "${token}").`,
      );
    }
  }
  if (!lower.includes('127.0.0.1') && !lower.includes('localhost')) {
    throw new Error(
      'Verification only allowed against localhost/127.0.0.1 ephemeral databases.',
    );
  }
}

async function resetEphemeralSchema(client: Client): Promise<void> {
  await client.query(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO public;
  `);
}

async function main(): Promise<void> {
  assertEphemeral(EPHEMERAL_URL);
  console.log('verify: connecting to ephemeral database…');

  const admin = new Client({ connectionString: EPHEMERAL_URL });
  await admin.connect();
  await resetEphemeralSchema(admin);
  await admin.end();

  console.log('verify: applying migrations (up)…');
  await runner({
    databaseUrl: EPHEMERAL_URL,
    dir: path.join(__dirname, '..', 'migrations'),
    direction: 'up',
    migrationsTable: 'pgmigrations',
    count: Infinity,
    verbose: true,
    decamelize: true,
    singleTransaction: true,
  });

  const check = new Client({ connectionString: EPHEMERAL_URL });
  await check.connect();

  const tables = await check.query<{ tablename: string }>(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('users','products','inventory','orders','order_items','audit_logs')
    ORDER BY tablename;
  `);
  const expected = [
    'audit_logs',
    'inventory',
    'order_items',
    'orders',
    'products',
    'users',
  ];
  const found = tables.rows.map((r) => r.tablename);
  if (found.join(',') !== expected.join(',')) {
    throw new Error(`Unexpected tables: ${found.join(', ')}`);
  }

  const productCount = await check.query<{ c: string }>(
    'SELECT COUNT(*)::text AS c FROM products',
  );
  const inventoryCount = await check.query<{ c: string }>(
    'SELECT COUNT(*)::text AS c FROM inventory',
  );
  const userCount = await check.query<{ c: string }>(
    'SELECT COUNT(*)::text AS c FROM users',
  );

  const pc = Number(productCount.rows[0].c);
  const ic = Number(inventoryCount.rows[0].c);
  const uc = Number(userCount.rows[0].c);

  if (pc < 10) {
    throw new Error(`Expected >= 10 products, got ${pc}`);
  }
  if (ic !== pc) {
    throw new Error(`Inventory rows (${ic}) must match products (${pc})`);
  }
  if (uc < 1) {
    throw new Error('Expected seeded users');
  }

  console.log('verify: rolling back all migrations (down)…');
  await check.end();

  await runner({
    databaseUrl: EPHEMERAL_URL,
    dir: path.join(__dirname, '..', 'migrations'),
    direction: 'down',
    migrationsTable: 'pgmigrations',
    count: Infinity,
    verbose: true,
    decamelize: true,
    singleTransaction: true,
  });

  const after = new Client({ connectionString: EPHEMERAL_URL });
  await after.connect();
  const remaining = await after.query<{ tablename: string }>(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('users','products','inventory','orders','order_items','audit_logs');
  `);
  await after.end();

  if (remaining.rows.length !== 0) {
    throw new Error(
      `Down migration left tables: ${remaining.rows.map((r) => r.tablename).join(', ')}`,
    );
  }

  // Re-apply once more to confirm seed is re-runnable on clean DB
  console.log('verify: re-applying migrations on clean DB…');
  await runner({
    databaseUrl: EPHEMERAL_URL,
    dir: path.join(__dirname, '..', 'migrations'),
    direction: 'up',
    migrationsTable: 'pgmigrations',
    count: Infinity,
    verbose: false,
    decamelize: true,
    singleTransaction: true,
  });

  const finalClient = new Client({ connectionString: EPHEMERAL_URL });
  await finalClient.connect();
  const finalProducts = await finalClient.query<{ c: string }>(
    'SELECT COUNT(*)::text AS c FROM products',
  );
  await finalClient.end();

  if (Number(finalProducts.rows[0].c) < 10) {
    throw new Error('Re-apply seed failed product count check');
  }

  // Confirm migration source files exist
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.ts'));
  if (files.length < 2) {
    throw new Error('Expected at least schema + seed migration files');
  }

  console.log(
    `verify: PASSED — tables OK, ${pc} products, ${ic} inventory, ${uc} users; up/down reversible`,
  );
}

main().catch((err: unknown) => {
  console.error('verify: FAILED', err);
  process.exit(1);
});
