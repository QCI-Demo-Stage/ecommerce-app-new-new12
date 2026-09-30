/** Provider-agnostic payment tokens persisted by the core service. */

export type PaymentProviderName = "stripe" | "paypal";

export type TokenKind = "customer" | "payment" | "refund";

export interface PaymentToken {
  /** Opaque provider token (e.g. cus_…, pi_…, re_…) — never card PAN/CVC */
  token: string;
  kind: TokenKind;
  provider: PaymentProviderName;
  /** Internal user / order correlation ids (non-PCI) */
  userId?: string;
  orderId?: string;
  createdAt: Date;
  metadata?: Record<string, string>;
}

export interface CreateCustomerInput {
  email: string;
  name?: string;
  userId: string;
  /** Optional phone — validated upstream; never log */
  phone?: string;
}

export interface CreateCustomerResult {
  customerToken: string;
  provider: PaymentProviderName;
}

export interface ChargeOrderInput {
  /** Amount in the smallest currency unit (e.g. cents) */
  amount: number;
  currency: string;
  /** Stored customer token from createCustomer */
  customerToken: string;
  orderId: string;
  userId: string;
  /**
   * Payment method token from Stripe.js / Elements (pm_…).
   * Never a raw card number.
   */
  paymentMethodToken: string;
  description?: string;
}

export interface ChargeOrderResult {
  paymentToken: string;
  status: "succeeded" | "requires_action" | "processing" | "failed";
  provider: PaymentProviderName;
  amount: number;
  currency: string;
}

export interface RefundOrderInput {
  /** Stored payment intent / charge token */
  paymentToken: string;
  orderId: string;
  userId: string;
  /** Optional partial refund in smallest currency unit */
  amount?: number;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
}

export interface RefundOrderResult {
  refundToken: string;
  status: "succeeded" | "pending" | "failed" | "canceled";
  provider: PaymentProviderName;
  amount: number | null;
}
