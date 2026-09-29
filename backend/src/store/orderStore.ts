import { randomUUID } from "crypto";

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderRecord {
  id: string;
  userId: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  itemCount: number;
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

/**
 * In-memory order store for account order history.
 * Swap for a Postgres-backed repository when the data layer is wired in.
 */
export class OrderStore {
  private readonly byId = new Map<string, OrderRecord>();

  async create(input: {
    userId: string;
    status?: OrderStatus;
    totalCents: number;
    currency?: string;
    itemCount: number;
    createdAt?: Date;
  }): Promise<OrderRecord> {
    const now = input.createdAt ?? new Date();
    const order: OrderRecord = {
      id: randomUUID(),
      userId: input.userId,
      status: input.status ?? "pending",
      totalCents: input.totalCents,
      currency: input.currency ?? "USD",
      itemCount: input.itemCount,
      createdAt: now,
      updatedAt: now,
    };
    this.byId.set(order.id, order);
    return order;
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
