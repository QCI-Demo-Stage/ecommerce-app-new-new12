/**
 * In-memory stores for payment customers, encrypted tokens, and charges.
 * Production will replace these with PostgreSQL repositories backed by the
 * payment_tokens / customers migrations.
 */

import { randomUUID } from "node:crypto";
import type {
  ChargeRecord,
  CustomerRecord,
  PaymentProviderName,
  PaymentTokenRecord,
} from "./types";

export interface CustomerStore {
  create(input: {
    email: string;
    name: string | null;
    provider: PaymentProviderName;
    providerCustomerId: string;
  }): Promise<CustomerRecord>;
  findById(id: string): Promise<CustomerRecord | null>;
  findByEmailAndProvider(
    email: string,
    provider: PaymentProviderName,
  ): Promise<CustomerRecord | null>;
}

export interface PaymentTokenStore {
  create(input: {
    customerId: string;
    tokenEncrypted: string;
  }): Promise<PaymentTokenRecord>;
  findByCustomerId(customerId: string): Promise<PaymentTokenRecord | null>;
  findByEncryptedToken(tokenEncrypted: string): Promise<PaymentTokenRecord | null>;
}

export interface ChargeStore {
  create(record: Omit<ChargeRecord, "createdAt"> & { createdAt?: Date }): Promise<ChargeRecord>;
  findById(id: string): Promise<ChargeRecord | null>;
  findByIdempotencyKey(key: string): Promise<ChargeRecord | null>;
  updateRefundedCents(id: string, refundedCents: number): Promise<ChargeRecord>;
}

export class InMemoryCustomerStore implements CustomerStore {
  private readonly byId = new Map<string, CustomerRecord>();

  async create(input: {
    email: string;
    name: string | null;
    provider: PaymentProviderName;
    providerCustomerId: string;
  }): Promise<CustomerRecord> {
    const now = new Date();
    const record: CustomerRecord = {
      id: cryptoRandomUuid(),
      email: input.email.toLowerCase(),
      name: input.name,
      provider: input.provider,
      providerCustomerId: input.providerCustomerId,
      createdAt: now,
      updatedAt: now,
    };
    this.byId.set(record.id, record);
    return record;
  }

  async findById(id: string): Promise<CustomerRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async findByEmailAndProvider(
    email: string,
    provider: PaymentProviderName,
  ): Promise<CustomerRecord | null> {
    const normalized = email.toLowerCase();
    for (const record of this.byId.values()) {
      if (record.email === normalized && record.provider === provider) {
        return record;
      }
    }
    return null;
  }
}

export class InMemoryPaymentTokenStore implements PaymentTokenStore {
  private readonly byId = new Map<string, PaymentTokenRecord>();
  private readonly byEncrypted = new Map<string, string>();

  async create(input: {
    customerId: string;
    tokenEncrypted: string;
  }): Promise<PaymentTokenRecord> {
    if (this.byEncrypted.has(input.tokenEncrypted)) {
      throw new Error("TOKEN_ENCRYPTED_UNIQUE_VIOLATION");
    }
    const now = new Date();
    const record: PaymentTokenRecord = {
      id: cryptoRandomUuid(),
      customerId: input.customerId,
      tokenEncrypted: input.tokenEncrypted,
      createdAt: now,
      updatedAt: now,
    };
    this.byId.set(record.id, record);
    this.byEncrypted.set(record.tokenEncrypted, record.id);
    return record;
  }

  async findByCustomerId(customerId: string): Promise<PaymentTokenRecord | null> {
    for (const record of this.byId.values()) {
      if (record.customerId === customerId) {
        return record;
      }
    }
    return null;
  }

  async findByEncryptedToken(
    tokenEncrypted: string,
  ): Promise<PaymentTokenRecord | null> {
    const id = this.byEncrypted.get(tokenEncrypted);
    if (!id) return null;
    return this.byId.get(id) ?? null;
  }
}

export class InMemoryChargeStore implements ChargeStore {
  private readonly byId = new Map<string, ChargeRecord>();
  private readonly byIdempotency = new Map<string, string>();

  async create(
    record: Omit<ChargeRecord, "createdAt"> & { createdAt?: Date },
  ): Promise<ChargeRecord> {
    if (record.idempotencyKey && this.byIdempotency.has(record.idempotencyKey)) {
      throw new Error("IDEMPOTENCY_KEY_CONFLICT");
    }
    const full: ChargeRecord = {
      ...record,
      createdAt: record.createdAt ?? new Date(),
    };
    this.byId.set(full.id, full);
    if (full.idempotencyKey) {
      this.byIdempotency.set(full.idempotencyKey, full.id);
    }
    return full;
  }

  async findById(id: string): Promise<ChargeRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async findByIdempotencyKey(key: string): Promise<ChargeRecord | null> {
    const id = this.byIdempotency.get(key);
    if (!id) return null;
    return this.byId.get(id) ?? null;
  }

  async updateRefundedCents(
    id: string,
    refundedCents: number,
  ): Promise<ChargeRecord> {
    const existing = this.byId.get(id);
    if (!existing) {
      throw new Error("CHARGE_NOT_FOUND");
    }
    const updated: ChargeRecord = { ...existing, refundedCents };
    this.byId.set(id, updated);
    return updated;
  }
}

function cryptoRandomUuid(): string {
  return randomUUID();
}
