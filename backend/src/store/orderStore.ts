import { randomUUID } from "crypto";

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderLineItem {
  productId: string;
  name: string;
  sku: string;
  priceCents: number;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderPaymentSummary {
  method: "card" | "paypal";
  /** Opaque token — never store raw card numbers */
  paymentToken: string;
  cardLast4?: string;
}

export interface OrderRecord {
  id: string;
  userId: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  itemCount: number;
  items: OrderLineItem[];
  shipping: ShippingAddress;
  payment: OrderPaymentSummary;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicOrder {
  id: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicOrderDetail extends PublicOrder {
  items: OrderLineItem[];
  shipping: ShippingAddress;
  payment: {
    method: "card" | "paypal";
    cardLast4?: string;
  };
}

export function toPublicOrder(order: OrderRecord): PublicOrder {
  return {
    id: order.id,
    status: order.status,
    totalCents: order.totalCents,
    currency: order.currency,
    itemCount: order.itemCount,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export function toPublicOrderDetail(order: OrderRecord): PublicOrderDetail {
  return {
    ...toPublicOrder(order),
    items: order.items,
    shipping: order.shipping,
    payment: {
      method: order.payment.method,
      cardLast4: order.payment.cardLast4,
    },
  };
}

/**
 * In-memory order store for checkout and account order history.
 * Swap for a Postgres-backed repository when the data layer is wired in.
 */
export class OrderStore {
  private readonly byId = new Map<string, OrderRecord>();

  async create(input: {
    userId: string;
    status?: OrderStatus;
    totalCents: number;
    currency?: string;
    items: OrderLineItem[];
    shipping: ShippingAddress;
    payment: OrderPaymentSummary;
    createdAt?: Date;
  }): Promise<OrderRecord> {
    const now = input.createdAt ?? new Date();
    const itemCount = input.items.reduce((sum, item) => sum + item.quantity, 0);
    const order: OrderRecord = {
      id: randomUUID(),
      userId: input.userId,
      status: input.status ?? "paid",
      totalCents: input.totalCents,
      currency: input.currency ?? "USD",
      itemCount,
      items: input.items,
      shipping: input.shipping,
      payment: input.payment,
      createdAt: now,
      updatedAt: now,
    };
    this.byId.set(order.id, order);
    return order;
  }

  async findById(id: string): Promise<OrderRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async listByUserId(
    userId: string,
    options: { page: number; pageSize: number },
  ): Promise<{ items: OrderRecord[]; total: number }> {
    const all = Array.from(this.byId.values())
      .filter((order) => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = all.length;
    const start = (options.page - 1) * options.pageSize;
    const items = all.slice(start, start + options.pageSize);
    return { items, total };
  }
}

export const orderStore = new OrderStore();
