/**
 * Shared payment domain types used by the core service and providers.
 * Only opaque provider tokens are stored — never PAN, CVV, or raw card data.
 */

export type PaymentProviderName = "stripe" | "paypal";

export type PaymentTokenKind = "customer" | "payment" | "refund";

export interface CustomerInput {
  email: string;
  name?: string;
  /** Internal user id for correlation; never sent as card data */
  userId: string;
  metadata?: Record<string, string>;
}

export interface ChargeOrderInput {
  /** Opaque customer token from createCustomer (e.g. cus_…) */
  customerToken: string;
  /** Amount in the smallest currency unit (e.g. cents) */
  amount: number;
  currency: string;
  /** Internal order id for idempotency / correlation */
  orderId: string;
  /**
   * Payment method token from Stripe.js / Elements (e.g. pm_…).
   * Required to confirm and capture; never a raw card number.
   */
  paymentMethodToken: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface RefundOrderInput {
  /** Opaque payment token from chargeOrder (e.g. pi_… or ch_…) */
  paymentToken: string;
  /** Optional partial refund in smallest currency unit */
  amount?: number;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
  orderId: string;
}

/** Opaque token returned by providers for storage by the core service */
export interface PaymentToken {
  provider: PaymentProviderName;
  kind: PaymentTokenKind;
  /** Provider-issued id only (customer.id, payment_intent.id, refund.id) */
  token: string;
  createdAt: Date;
  /** Safe correlation fields — no raw provider error or card data */
  references?: {
    userId?: string;
    orderId?: string;
    customerToken?: string;
    paymentToken?: string;
  };
}

export interface ChargeResult {
  paymentToken: PaymentToken;
  status: "succeeded" | "processing" | "requires_action" | "canceled";
  amount: number;
  currency: string;
}

export interface RefundResult {
  refundToken: PaymentToken;
  status: "succeeded" | "pending" | "failed" | "canceled";
  amount: number;
  currency: string;
}

/**
 * User-facing payment error. Message is safe to return to clients;
 * never includes raw Stripe payloads or secrets.
 */
export class PaymentError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  readonly provider?: PaymentProviderName;

  constructor(opts: {
    code: string;
    message: string;
    httpStatus?: number;
    provider?: PaymentProviderName;
  }) {
    super(opts.message);
    this.name = "PaymentError";
    this.code = opts.code;
    this.httpStatus = opts.httpStatus ?? 502;
    this.provider = opts.provider;
  }
}
