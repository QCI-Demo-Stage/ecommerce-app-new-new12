export type PaymentProviderName = "stripe" | "paypal";

export interface CreateCustomerInput {
  email: string;
  displayName?: string;
  provider: PaymentProviderName;
  metadata?: Record<string, string>;
}

export interface CreateCustomerResult {
  id: string;
  email: string;
  displayName: string | null;
  provider: PaymentProviderName;
  providerCustomerId: string;
  createdAt: string;
}

export interface ChargeOrderInput {
  customerId: string;
  orderId: string;
  amountCents: number;
  currency: string;
  /** Provider payment-method token from client SDK — never raw PAN. */
  paymentMethodToken: string;
  provider: PaymentProviderName;
  idempotencyKey?: string;
}

export interface ChargeOrderResult {
  chargeId: string;
  customerId: string;
  orderId: string;
  amountCents: number;
  currency: string;
  status: "succeeded" | "pending" | "failed";
  provider: PaymentProviderName;
  paymentTokenId: string;
  createdAt: string;
}

export interface RefundInput {
  chargeId: string;
  amountCents?: number;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer" | "other";
  idempotencyKey?: string;
  provider?: PaymentProviderName;
}

export interface RefundResult {
  refundId: string;
  chargeId: string;
  amountCents: number;
  currency: string;
  status: "succeeded" | "pending" | "failed";
  provider: PaymentProviderName;
  reason: string | null;
  createdAt: string;
}
