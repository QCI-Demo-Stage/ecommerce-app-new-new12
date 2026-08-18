import Stripe from "stripe";
import {
  PaymentError,
  type PaymentErrorCode,
} from "../errors";
import type { StandardizedErrorLog } from "../../utils/logger";
import { logger } from "../../utils/logger";

/**
 * Maps Stripe SDK errors to user-friendly PaymentError instances and
 * standardized log records. Raw Stripe error objects are never persisted.
 */
export function mapStripeError(
  err: unknown,
  action: string,
): PaymentError {
  const std = toStandardizedError(err, action);
  logger.paymentError(std);

  return new PaymentError({
    code: std.code as PaymentErrorCode,
    userMessage: std.message,
    httpStatus: std.httpStatus,
    provider: "stripe",
  });
}

function toStandardizedError(
  err: unknown,
  action: string,
): StandardizedErrorLog & { code: PaymentErrorCode } {
  if (err instanceof PaymentError) {
    return {
      code: err.code,
      message: err.userMessage,
      provider: "stripe",
      action,
      httpStatus: err.httpStatus,
    };
  }

  if (err instanceof Stripe.errors.StripeError) {
    return mapKnownStripeError(err, action);
  }

  return {
    code: "unknown_error",
    message: "Payment processing failed. Please try again later.",
    provider: "stripe",
    action,
    httpStatus: 502,
    errorType: "unknown",
  };
}

function mapKnownStripeError(
  err: Stripe.StripeRawError | Stripe.errors.StripeError,
  action: string,
): StandardizedErrorLog & { code: PaymentErrorCode } {
  const type = "type" in err ? String(err.type) : "StripeError";
  const declineCode =
    "decline_code" in err && typeof err.decline_code === "string"
      ? err.decline_code
      : undefined;
  const code =
    "code" in err && typeof err.code === "string" ? err.code : undefined;

  if (
    err instanceof Stripe.errors.StripeCardError ||
    type === "card_error"
  ) {
    return {
      code: mapDeclineCode(declineCode ?? code),
      message: userMessageForDecline(declineCode ?? code),
      provider: "stripe",
      action,
      httpStatus: 402,
      errorType: "card_error",
    };
  }

  if (
    err instanceof Stripe.errors.StripeRateLimitError ||
    type === "rate_limit_error"
  ) {
    return {
      code: "rate_limited",
      message: "Payment service is busy. Please try again shortly.",
      provider: "stripe",
      action,
      httpStatus: 429,
      errorType: "rate_limit_error",
    };
  }

  if (
    err instanceof Stripe.errors.StripeInvalidRequestError ||
    type === "invalid_request_error"
  ) {
    return {
      code: "invalid_request",
      message: "The payment request was invalid. Please check your details.",
      provider: "stripe",
      action,
      httpStatus: 400,
      errorType: "invalid_request_error",
    };
  }

  if (
    err instanceof Stripe.errors.StripeAuthenticationError ||
    type === "authentication_error"
  ) {
    return {
      code: "configuration_error",
      message: "Payment service is temporarily unavailable.",
      provider: "stripe",
      action,
      httpStatus: 503,
      errorType: "authentication_error",
    };
  }

  if (
    err instanceof Stripe.errors.StripeConnectionError ||
    err instanceof Stripe.errors.StripeAPIError ||
    type === "api_error" ||
    type === "api_connection_error"
  ) {
    return {
      code: "provider_unavailable",
      message: "Payment service is temporarily unavailable. Please try again.",
      provider: "stripe",
      action,
      httpStatus: 503,
      errorType: type,
    };
  }

  return {
    code: "payment_failed",
    message: "Payment could not be completed. Please try again.",
    provider: "stripe",
    action,
    httpStatus: 402,
    errorType: type,
  };
}

function mapDeclineCode(code: string | undefined): PaymentErrorCode {
  switch (code) {
    case "insufficient_funds":
      return "insufficient_funds";
    case "authentication_required":
      return "authentication_required";
    case "expired_card":
    case "incorrect_cvc":
    case "incorrect_number":
    case "card_declined":
    case "generic_decline":
      return "card_declined";
    default:
      return "card_declined";
  }
}

function userMessageForDecline(code: string | undefined): string {
  switch (code) {
    case "insufficient_funds":
      return "Your card has insufficient funds.";
    case "authentication_required":
      return "Additional authentication is required to complete this payment.";
    case "expired_card":
      return "Your card has expired. Please use a different card.";
    case "incorrect_cvc":
      return "The card security code is incorrect.";
    case "incorrect_number":
      return "The card number is incorrect.";
    default:
      return "Your card was declined. Please try a different payment method.";
  }
}
