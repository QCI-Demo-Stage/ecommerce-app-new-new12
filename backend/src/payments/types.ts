/** Provider-agnostic customer identity used by the core payment service. */
export interface CreateCustomerInput {
  email: string;
  name?: string;
  /** Internal user id — stored as Stripe metadata, never as card data */
  userId?: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerResult {
  /** Opaque provider token suitable for persistence (e.g. cus_…) */
  customerToken: string;
  provider: "stripe";
}

export interface ChargeOrderInput {
  /** Amount in the smallest currency unit (e.g. cents) */
  amount: number;
  currency: string;
  /** Previously persisted Stripe customer token */
  customerToken: string;
  /** Stripe PaymentMethod id (pm_…) — never raw card numbers */
  paymentMethodId: string;
  /** Idempotency / order correlation */
  orderId?: string;
  description?: string;
  metadata?: Record<string, string>;
  /** When true (default), confirm and capture in one step */
  capture?: boolean;
}

export interface ChargeOrderResult {
  /** Opaque payment token suitable for persistence (e.g. pi_…) */
  paymentToken: string;
  status: string;
  amount: number;
  currency: string;
  provider: "stripe";
}

export interface RefundOrderInput {
  /** Previously persisted payment intent token */
  paymentToken: string;
  /** Optional partial refund in smallest currency unit */
  amount?: number;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
  metadata?: Record<string, string>;
}

export interface RefundOrderResult {
  refundToken: string;
  paymentToken: string;
  status: string;
  amount: number | null;
  provider: "stripe";
}

export type PaymentTokenKind = "customer" | "payment" | "refund";

export interface StoredPaymentToken {
  id: string;
  kind: PaymentTokenKind;
  provider: "stripe";
  /** Opaque provider reference only — never raw card or error payloads */
  providerToken: string;
  userId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}
