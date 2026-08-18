import { randomUUID } from "crypto";
import type { PaymentTokenKind, StoredPaymentToken } from "./types";

export interface PersistTokenInput {
  kind: PaymentTokenKind;
  provider: "stripe";
  providerToken: string;
  userId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  status?: string;
}

/**
 * In-memory token store for provider references (customer / payment / refund).
 * Only opaque tokens and safe metadata are retained — never PAN, CVV, or
 * raw Stripe error objects.
 */
export class PaymentTokenStore {
  private readonly byId = new Map<string, StoredPaymentToken>();
  private readonly byProviderToken = new Map<string, string>();

  async save(input: PersistTokenInput): Promise<StoredPaymentToken> {
    const existingId = this.byProviderToken.get(input.providerToken);
    const now = new Date();

    if (existingId) {
      const existing = this.byId.get(existingId);
      if (existing) {
        const updated: StoredPaymentToken = {
          ...existing,
          userId: input.userId ?? existing.userId,
          orderId: input.orderId ?? existing.orderId,
          amount: input.amount ?? existing.amount,
          currency: input.currency ?? existing.currency,
          status: input.status ?? existing.status,
          updatedAt: now,
        };
        this.byId.set(existingId, updated);
        return updated;
      }
    }

    const record: StoredPaymentToken = {
      id: randomUUID(),
      kind: input.kind,
      provider: input.provider,
      providerToken: input.providerToken,
      userId: input.userId,
      orderId: input.orderId,
      amount: input.amount,
      currency: input.currency,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };

    this.byId.set(record.id, record);
    this.byProviderToken.set(record.providerToken, record.id);
    return record;
  }

  async findByProviderToken(
    providerToken: string,
  ): Promise<StoredPaymentToken | null> {
    const id = this.byProviderToken.get(providerToken);
    if (!id) {
      return null;
    }
    return this.byId.get(id) ?? null;
  }

  async findById(id: string): Promise<StoredPaymentToken | null> {
    return this.byId.get(id) ?? null;
  }

  async listByUserId(userId: string): Promise<StoredPaymentToken[]> {
    return [...this.byId.values()].filter((t) => t.userId === userId);
  }
}

export const paymentTokenStore = new PaymentTokenStore();
