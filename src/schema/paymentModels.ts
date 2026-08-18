/**
 * TypeScript domain model mappings for payment tokenization tables.
 * tokenEncrypted holds KMS ciphertext only — never plaintext provider tokens.
 */

export type PaymentProvider = "stripe" | "paypal";

export interface Customer {
  id: string;
  email: string;
  displayName: string | null;
  provider: PaymentProvider;
  providerCustomerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentToken {
  id: string;
  customerId: string;
  /** Simulated/application KMS ciphertext (base64 envelope). Never plaintext. */
  tokenEncrypted: string;
  createdAt: Date;
  updatedAt: Date;
}

export const PAYMENT_TABLES = {
  customers: "customers",
  paymentTokens: "payment_tokens",
} as const;
