/**
 * TypeScript domain model mappings for the ecommerce core schema.
 * These types mirror PostgreSQL tables for backend service consumption.
 * Monetary amounts are integer cents to avoid floating-point drift.
 */

export type UserRole = 'customer' | 'admin' | 'support';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type AuditAction =
  | 'insert'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'status_change';

export interface User {
  id: string;
  email: string;
  /** bcrypt (or argon2) hash — never plaintext */
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  category: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: string;
  productId: string;
  quantityOnHand: number;
  quantityReserved: number;
  reorderThreshold: number;
  warehouseLocation: string | null;
  updatedAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  shippingAddressLine1: string;
  shippingAddressLine2: string | null;
  shippingCity: string;
  shippingRegion: string | null;
  shippingPostalCode: string;
  shippingCountry: string;
  placedAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  actorUserId: string | null;
  changes: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/** Table name constants for query builders / repositories */
export const Tables = {
  users: 'users',
  products: 'products',
  inventory: 'inventory',
  orders: 'orders',
  orderItems: 'order_items',
  auditLogs: 'audit_logs',
} as const;
