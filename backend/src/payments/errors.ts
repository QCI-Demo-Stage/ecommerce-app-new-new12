/**
 * Typed domain errors for the payment service layer.
 * Mapped to HTTP status codes by the route handlers.
 */

export type PaymentErrorCode =
  | "validation_error"
  | "unauthorized"
  | "payment_required"
  | "not_found"
  | "conflict"
  | "unprocessable_entity"
  | "provider_error"
  | "internal_error";

export class PaymentError extends Error {
  readonly code: PaymentErrorCode;
  readonly httpStatus: number;
  readonly providerCode: string | null;
  readonly details: Array<{ path: string; message: string }> | null;

  constructor(
    code: PaymentErrorCode,
    message: string,
    options?: {
      httpStatus?: number;
      providerCode?: string | null;
      details?: Array<{ path: string; message: string }> | null;
      cause?: unknown;
    },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "PaymentError";
    this.code = code;
    this.httpStatus = options?.httpStatus ?? defaultHttpStatus(code);
    this.providerCode = options?.providerCode ?? null;
    this.details = options?.details ?? null;
  }
}

function defaultHttpStatus(code: PaymentErrorCode): number {
  switch (code) {
    case "validation_error":
      return 400;
    case "unauthorized":
      return 401;
    case "payment_required":
      return 402;
    case "not_found":
      return 404;
    case "conflict":
      return 409;
    case "unprocessable_entity":
      return 422;
    case "provider_error":
      return 502;
    case "internal_error":
    default:
      return 500;
  }
}
