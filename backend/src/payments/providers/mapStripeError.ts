import Stripe from "stripe";
import { PaymentError, type PaymentErrorCode } from "../errors";
import type { PaymentLogger } from "../logger";

/**
 * Sanitized Stripe error fields suitable for logging and client responses.
 * Never includes raw SDK payloads, request bodies, or secrets.
 */
export interface StandardizedStripeError {
  code: PaymentErrorCode;
  message: string;
  httpStatus: number;
  providerCode: string | null;
  type: string | null;
}

/**
 * Maps Stripe SDK errors to sanitized PaymentError instances and logs them.
 * Raw Stripe error objects and response bodies are never returned or persisted.
 */
export function mapStripeError(
  err: unknown,
  action: string,
  logger?: PaymentLogger,
): PaymentError {
  const mapped = toStandardizedError(err);

  logger?.log({
    level: "error",
    action,
    result: "failure",
    provider: "stripe",
    errorCode: mapped.code,
    message: mapped.message,
  });

  return new PaymentError(mapped.code, mapped.message, {
    httpStatus: mapped.httpStatus,
    providerCode: mapped.providerCode,
  });
}

export function toStandardizedError(err: unknown): StandardizedStripeError {
  if (err instanceof PaymentError) {
    return {
      code: err.code,
      message: err.message,
      httpStatus: err.httpStatus,
      providerCode: err.providerCode,
      type: null,
    };
  }

  if (err instanceof Stripe.errors.StripeError) {
    return {
      code: mapStripeCode(err),
      message: userFriendlyMessage(err),
      httpStatus: mapHttpStatus(err),
      providerCode: err.code ?? err.type ?? null,
      type: err.type,
    };
  }

  return {
    code: "provider_error",
    message: "Payment processing failed. Please try again later.",
    httpStatus: 502,
    providerCode: null,
    type: "unknown",
  };
}

function mapStripeCode(err: Stripe.errors.StripeError): PaymentErrorCode {
  switch (err.code) {
    case "card_declined":
    case "expired_card":
    case "incorrect_cvc":
    case "insufficient_funds":
    case "authentication_required":
      return "payment_required";
    case "resource_missing":
      return "not_found";
    case "rate_limit":
      return "provider_error";
    default:
      break;
  }

  if (err instanceof Stripe.errors.StripeCardError) {
    return "payment_required";
  }
  if (err instanceof Stripe.errors.StripeInvalidRequestError) {
    return "validation_error";
  }
  if (err instanceof Stripe.errors.StripeAuthenticationError) {
    return "unauthorized";
  }

  return "provider_error";
}

function mapHttpStatus(err: Stripe.errors.StripeError): number {
  if (err instanceof Stripe.errors.StripeCardError) {
    return 402;
  }
  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 600) {
    return err.statusCode;
  }
  return 502;
}

function userFriendlyMessage(err: Stripe.errors.StripeError): string {
  if (err instanceof Stripe.errors.StripeCardError) {
    switch (err.code) {
      case "expired_card":
        return "Your card has expired. Please use a different payment method.";
      case "incorrect_cvc":
        return "The card security code is incorrect. Please try again.";
      case "insufficient_funds":
        return "Your card has insufficient funds for this purchase.";
      case "card_declined":
      default:
        return "Your card was declined. Please try a different payment method.";
    }
  }

  if (err instanceof Stripe.errors.StripeRateLimitError) {
    return "Payment service is busy. Please wait a moment and try again.";
  }

  if (err instanceof Stripe.errors.StripeConnectionError) {
    return "Unable to reach the payment provider. Please try again shortly.";
  }

  if (err instanceof Stripe.errors.StripeAuthenticationError) {
    return "Payment service configuration error. Please contact support.";
  }

  if (err instanceof Stripe.errors.StripeInvalidRequestError) {
    return "The payment request was invalid. Please verify your details and try again.";
  }

  return "Payment processing failed. Please try again later.";
}
