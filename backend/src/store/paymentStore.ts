import { randomUUID } from "crypto";
import type { PaymentProviderName } from "../services/payment/types";

export interface CustomerRecord {
  id: string;
  email: string;
  displayName: string | null;
  provider: PaymentProviderName;
  providerCustomerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentTokenRecord {
  id: string;
  customerId: string;
  /** KMS ciphertext envelope — never plaintext */
  tokenEncrypted: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChargeRecord {
  chargeId: string;
  customerId: string;
  orderId: string;
  amountCents: number;
  currency: string;
  provider: PaymentProviderName;
  paymentTokenId: string;
  status: "succeeded" | "pending" | "failed";
  refundedCents: number;
  createdAt: Date;
}

/**
 * In-memory stores aligned with customers / payment_tokens schema.
 * Swap for Postgres repositories when the data layer is wired in.
 */
export class PaymentStore {
  private readonly customersById = new Map<string, CustomerRecord>();
  private readonly tokensById = new Map<string, PaymentTokenRecord>();
  private readonly tokensByEncrypted = new Map<string, string>();
  private readonly chargesById = new Map<string, ChargeRecord>();
  private readonly idempotency = new Map<string, string>();

  async createCustomer(input: {
    email: string;
    displayName: string | null;
    provider: PaymentProviderName;
    providerCustomerId: string;
  }): Promise<CustomerRecord> {
    const now = new Date();
    const customer: CustomerRecord = {
      id: randomUUID(),
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      provider: input.provider,
      providerCustomerId: input.providerCustomerId,
      createdAt: now,
      updatedAt: now,
    };
    this.customersById.set(customer.id, customer);
    return customer;
  }

  async findCustomer(id: string): Promise<CustomerRecord | null> {
    return this.customersById.get(id) ?? null;
  }

  async saveEncryptedToken(input: {
    customerId: string;
    tokenEncrypted: string;
  }): Promise<PaymentTokenRecord> {
    const existingId = this.tokensByEncrypted.get(input.tokenEncrypted);
    if (existingId) {
      const existing = this.tokensById.get(existingId);
      if (existing) {
        return existing;
      }
    }
    const now = new Date();
    const token: PaymentTokenRecord = {
      id: randomUUID(),
      customerId: input.customerId,
      tokenEncrypted: input.tokenEncrypted,
      createdAt: now,
      updatedAt: now,
    };
    this.tokensById.set(token.id, token);
    this.tokensByEncrypted.set(token.tokenEncrypted, token.id);
    return token;
  }

  async saveCharge(charge: ChargeRecord): Promise<void> {
    this.chargesById.set(charge.chargeId, charge);
  }

  async findCharge(chargeId: string): Promise<ChargeRecord | null> {
    return this.chargesById.get(chargeId) ?? null;
  }

  async updateChargeRefunded(
    chargeId: string,
    refundedCents: number,
  ): Promise<void> {
    const charge = this.chargesById.get(chargeId);
    if (!charge) {
      return;
    }
    charge.refundedCents = refundedCents;
  }

  getIdempotentResult(key: string): string | undefined {
    return this.idempotency.get(key);
  }

  setIdempotentResult(key: string, resultJson: string): void {
    this.idempotency.set(key, resultJson);
  }
}

export const paymentStore = new PaymentStore();
