export type PaymentErrorCode =
  | "validation_error"
  | "not_found"
  | "conflict"
  | "payment_declined"
  | "provider_error"
  | "internal_error";

export class PaymentError extends Error {
  readonly code: PaymentErrorCode;
  readonly httpStatus: number;

  constructor(code: PaymentErrorCode, message: string, httpStatus: number) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export function isPaymentError(err: unknown): err is PaymentError {
  return err instanceof PaymentError;
}
