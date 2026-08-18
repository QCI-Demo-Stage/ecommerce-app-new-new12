-- Demo seed data (idempotent). Prefer: npm run migrate:up (includes seed migration).
-- Passwords are bcrypt hashes only — never plaintext.

INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'admin@example.com',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'Ada', 'Admin', 'admin', true),
  ('22222222-2222-4222-8222-222222222222', 'alice@example.com',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'Alice', 'Nguyen', 'customer', true),
  ('33333333-3333-4333-8333-333333333333', 'bob@example.com',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'Bob', 'Patel', 'customer', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (id, sku, name, description, price_cents, currency, category, is_active) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'WDG-001', 'Classic Widget', 'Everyday widget for home and office.', 1999, 'USD', 'widgets', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'WDG-002', 'Pro Widget', 'Heavy-duty widget with extended warranty.', 4999, 'USD', 'widgets', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'GAD-100', 'Smart Gadget Mini', 'Compact connected gadget with USB-C.', 7999, 'USD', 'gadgets', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'GAD-200', 'Smart Gadget Plus', 'Full-size gadget with wireless charging.', 12999, 'USD', 'gadgets', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'ACC-010', 'USB-C Cable 2m', 'Braided USB-C cable, 2 meter length.', 1299, 'USD', 'accessories', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', 'ACC-020', 'Wireless Mouse', 'Ergonomic wireless mouse with silent clicks.', 3499, 'USD', 'accessories', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7', 'ACC-030', 'Laptop Stand', 'Aluminum laptop stand, adjustable height.', 5999, 'USD', 'accessories', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8', 'HME-050', 'Desk Lamp LED', 'Dimmable LED desk lamp with USB port.', 4499, 'USD', 'home', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9', 'HME-060', 'Ceramic Mug Set', 'Set of 4 stoneware mugs, 12 oz.', 2999, 'USD', 'home', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10', 'OUT-070', 'Trail Water Bottle', 'Insulated 32 oz stainless bottle.', 3499, 'USD', 'outdoors', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11', 'OUT-080', 'Daypack 20L', 'Lightweight daypack with laptop sleeve.', 6999, 'USD', 'outdoors', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12', 'OFF-090', 'Notebook A5 Dot Grid', 'Hardcover notebook, 192 pages.', 1499, 'USD', 'office', true)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO inventory (product_id, quantity_on_hand, quantity_reserved, reorder_threshold, warehouse_location) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 120, 5, 10, 'WH-EAST-A1'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 75, 10, 10, 'WH-EAST-A1'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 50, 2, 10, 'WH-WEST-B2'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 40, 0, 10, 'WH-WEST-B2'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 500, 20, 10, 'WH-EAST-C3'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', 200, 8, 10, 'WH-EAST-C3'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7', 90, 3, 10, 'WH-CENT-D1'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8', 110, 4, 10, 'WH-CENT-D1'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9', 150, 0, 10, 'WH-EAST-C3'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10', 180, 12, 10, 'WH-WEST-B2'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11', 65, 5, 10, 'WH-WEST-B2'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12', 300, 15, 10, 'WH-EAST-A1')
ON CONFLICT (product_id) DO NOTHING;
