/**
 * Shared DDL helpers and column conventions for ecommerce schema migrations.
 */
export const SCHEMA_VERSION = '1.0.0';

export const TIMESTAMP_COLUMNS = `
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
`;

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const USER_ROLES = ['customer', 'admin', 'support'] as const;

export type UserRole = (typeof USER_ROLES)[number];
