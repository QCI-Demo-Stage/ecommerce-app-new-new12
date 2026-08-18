/**
 * User-facing payment errors. Raw provider errors must never be
 * attached or persisted on these instances.
 */

export type PaymentErrorCode =
  | "payment_failed"
  | "card_declined"
  | "insufficient_funds"
  | "authentication_required"
  | "invalid_request"
  | "customer_error"
  | "refund_error"
  | "provider_unavailable"
  | "configuration_error"
  | "rate_limited"
  | "unknown_error";

export class PaymentError extends Error {
  readonly code: PaymentErrorCode;
  readonly httpStatus: number;
  readonly provider?: string;
  /** Safe message suitable for API clients */
  readonly userMessage: string;

  constructor(opts: {
    code: PaymentErrorCode;
    userMessage: string;
    httpStatus?: number;
    provider?: string;
  }) {
    super(opts.userMessage);
    this.name = "PaymentError";
    this.code = opts.code;
    this.userMessage = opts.userMessage;
    this.httpStatus = opts.httpStatus ?? 402;
    this.provider = opts.provider;
  }

  toJSON(): {
    error: PaymentErrorCode;
    message: string;
  } {
    return {
      error: this.code,
      message: this.userMessage,
    };
  }
}
