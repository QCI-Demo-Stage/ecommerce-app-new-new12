import { randomUUID } from "crypto";
import type { PaymentToken, PaymentTokenKind } from "../services/payments/types";

export interface StoredPaymentToken extends PaymentToken {
  id: string;
  persistedAt: Date;
}

/**
 * In-memory store for opaque payment provider tokens.
 * Never stores PAN, CVV, raw SDK errors, or credentials.
 * Swap for an encrypted Postgres-backed repository when the data layer is wired in.
 */
export class PaymentTokenStore {
  private readonly byId = new Map<string, StoredPaymentToken>();
  private readonly byProviderToken = new Map<string, string>();

  async save(token: PaymentToken): Promise<StoredPaymentToken> {
    const key = `${token.provider}:${token.kind}:${token.token}`;
    const existingId = this.byProviderToken.get(key);
    if (existingId) {
      const existing = this.byId.get(existingId);
      if (existing) {
        return existing;
      }
    }

    const stored: StoredPaymentToken = {
      ...token,
      id: randomUUID(),
      persistedAt: new Date(),
    };

    this.byId.set(stored.id, stored);
    this.byProviderToken.set(key, stored.id);
    return stored;
  }

  async findByProviderToken(
    provider: string,
    kind: PaymentTokenKind,
    token: string,
  ): Promise<StoredPaymentToken | null> {
    const key = `${provider}:${kind}:${token}`;
    const id = this.byProviderToken.get(key);
    if (!id) {
      return null;
    }
    return this.byId.get(id) ?? null;
  }

  async findById(id: string): Promise<StoredPaymentToken | null> {
    return this.byId.get(id) ?? null;
  }

  async listByUserId(userId: string): Promise<StoredPaymentToken[]> {
    return [...this.byId.values()].filter(
      (t) => t.references?.userId === userId,
    );
  }

  async listByOrderId(orderId: string): Promise<StoredPaymentToken[]> {
    return [...this.byId.values()].filter(
      (t) => t.references?.orderId === orderId,
    );
  }
}

export const paymentTokenStore = new PaymentTokenStore();
