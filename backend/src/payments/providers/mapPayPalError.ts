/**
 * Maps PayPal SDK / REST errors to sanitized PaymentError instances.
 * Never persists or returns raw SDK payloads to callers.
 */

import { ApiError } from "@paypal/paypal-server-sdk";
import { PaymentError } from "../errors";
import type { PaymentLogger } from "../logger";

interface PayPalErrorBody {
  name?: string;
  message?: string;
  details?: Array<{ issue?: string; description?: string }>;
}

function readErrorBody(err: ApiError<unknown>): PayPalErrorBody {
  const result = err.result;
  if (result && typeof result === "object") {
    return result as PayPalErrorBody;
  }
  return {};
}

/**
 * Converts an unknown PayPal failure into a domain PaymentError and logs it.
 */
export function mapPayPalError(
  err: unknown,
  action: string,
  logger?: PaymentLogger,
): PaymentError {
  if (err instanceof PaymentError) {
    return err;
  }

  let mapped: PaymentError;

  if (err instanceof ApiError) {
    const body = readErrorBody(err);
    const providerCode = body.name ?? body.details?.[0]?.issue ?? `HTTP_${err.statusCode}`;
    const status = err.statusCode;

    if (status === 400 || status === 422) {
      mapped = new PaymentError(
        "validation_error",
        "PayPal rejected the payment request. Please verify the order details.",
        { providerCode, httpStatus: 400 },
      );
    } else if (status === 401 || status === 403) {
      mapped = new PaymentError(
        "provider_error",
        "PayPal authentication failed. Please contact support.",
        { providerCode, httpStatus: 502 },
      );
    } else if (
      status === 402 ||
      providerCode === "INSTRUMENT_DECLINED" ||
      providerCode === "PAYER_CANNOT_PAY" ||
      providerCode === "TRANSACTION_REFUSED"
    ) {
      mapped = new PaymentError(
        "payment_required",
        "Payment could not be completed. Please try a different payment method.",
        { providerCode, httpStatus: 402 },
      );
    } else if (status === 404) {
      mapped = new PaymentError(
        "not_found",
        "PayPal payment resource was not found.",
        { providerCode, httpStatus: 404 },
      );
    } else if (status === 409) {
      mapped = new PaymentError(
        "conflict",
        "PayPal reported a conflicting payment state.",
        { providerCode, httpStatus: 409 },
      );
    } else {
      mapped = new PaymentError(
        "provider_error",
        "PayPal provider unavailable. Please try again later.",
        { providerCode, httpStatus: 502 },
      );
    }
  } else {
    mapped = new PaymentError(
      "provider_error",
      "PayPal provider unavailable. Please try again later.",
      { cause: err },
    );
  }

  logger?.log({
    level: "error",
    action,
    result: "failure",
    provider: "paypal",
    errorCode: mapped.code,
    message: mapped.message,
  });

  return mapped;
}
