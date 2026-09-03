/**
 * Shared payment domain types for the unified payment service abstraction.
 */

export type PaymentProviderName = "stripe" | "paypal";

export type ChargeStatus = "succeeded" | "pending" | "failed";
export type RefundStatus = "succeeded" | "pending" | "failed";

export type RefundReason =
  | "requested_by_customer"
  | "duplicate"
  | "fraudulent"
  | "order_change"
  | "other";

export interface CreateCustomerInput {
  email: string;
  name?: string;
  provider: PaymentProviderName;
  paymentMethodToken: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerResult {
  customerId: string;
  provider: PaymentProviderName;
  providerCustomerId: string;
  paymentTokenId: string;
  createdAt: string;
}

export interface ChargeOrderInput {
  customerId: string;
  orderId: string;
  amountCents: number;
  currency: string;
  idempotencyKey?: string;
  description?: string;
}

export interface ChargeOrderResult {
  chargeId: string;
  customerId: string;
  orderId: string;
  amountCents: number;
  currency: string;
  status: ChargeStatus;
  provider: PaymentProviderName;
  providerChargeId: string;
  /** Encrypted provider order/charge token row id (KMS-backed) */
  paymentTokenId: string;
  createdAt: string;
}

export interface RefundInput {
  chargeId: string;
  amountCents?: number;
  reason?: RefundReason;
  idempotencyKey?: string;
}

export interface RefundResult {
  refundId: string;
  chargeId: string;
  amountCents: number;
  currency: string;
  status: RefundStatus;
  provider: PaymentProviderName;
  providerRefundId: string;
  reason: RefundReason | null;
  createdAt: string;
}

export interface CustomerRecord {
  id: string;
  email: string;
  name: string | null;
  provider: PaymentProviderName;
  providerCustomerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentTokenRecord {
  id: string;
  customerId: string;
  tokenEncrypted: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChargeRecord {
  id: string;
  customerId: string;
  orderId: string;
  amountCents: number;
  currency: string;
  status: ChargeStatus;
  provider: PaymentProviderName;
  providerChargeId: string;
  /** Encrypted provider order-id token row (payment_tokens.id) */
  paymentTokenId: string | null;
  refundedCents: number;
  idempotencyKey: string | null;
  createdAt: Date;
}
