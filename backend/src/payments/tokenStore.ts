import { randomUUID } from "crypto";
import type { PaymentToken, TokenKind } from "./types";

/**
 * In-memory store for opaque payment tokens (customer / payment / refund).
 * Persists provider tokens only — never card PAN, CVC, or raw Stripe errors.
 * Swap for an encrypted Postgres-backed repository when the data layer is ready.
 */
export class PaymentTokenStore {
  private readonly byId = new Map<string, PaymentToken & { id: string }>();
  private readonly byToken = new Map<string, string>();

  async save(
    record: Omit<PaymentToken, "createdAt"> & { createdAt?: Date },
  ): Promise<PaymentToken & { id: string }> {
    const id = randomUUID();
    const stored = {
      id,
      ...record,
      createdAt: record.createdAt ?? new Date(),
    };
    this.byId.set(id, stored);
    this.byToken.set(`${record.provider}:${record.kind}:${record.token}`, id);
    return stored;
  }

  async findByProviderToken(
    provider: string,
    kind: TokenKind,
    token: string,
  ): Promise<(PaymentToken & { id: string }) | null> {
    const id = this.byToken.get(`${provider}:${kind}:${token}`);
    if (!id) {
      return null;
    }
    return this.byId.get(id) ?? null;
  }

  async findByUser(
    userId: string,
    kind?: TokenKind,
  ): Promise<Array<PaymentToken & { id: string }>> {
    const results: Array<PaymentToken & { id: string }> = [];
    for (const record of this.byId.values()) {
      if (record.userId !== userId) {
        continue;
      }
      if (kind && record.kind !== kind) {
        continue;
      }
      results.push(record);
    }
    return results;
  }
}

export const paymentTokenStore = new PaymentTokenStore();
