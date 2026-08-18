import Stripe from "stripe";
import { logger, type StandardizedErrorLog } from "../../../utils/logger";
import { PaymentError } from "../types";

/**
 * Maps Stripe SDK errors to sanitized, user-friendly PaymentError instances.
 * Raw Stripe error objects and response bodies are never returned or persisted.
 */
export function mapStripeError(err: unknown, action: string): PaymentError {
  const mapped = toStandardizedError(err, action);
  logger.logStandardizedError(mapped);

  return new PaymentError({
    code: mapped.code,
    message: mapped.message,
    httpStatus: mapped.httpStatus,
    provider: "stripe",
  });
}

function toStandardizedError(
  err: unknown,
  action: string,
): StandardizedErrorLog {
  if (err instanceof Stripe.errors.StripeError) {
    return {
      action,
      provider: "stripe",
      code: mapStripeCode(err),
      message: userFriendlyMessage(err),
      httpStatus: err.statusCode ?? 502,
      type: err.type,
    };
  }

  if (err instanceof PaymentError) {
    return {
      action,
      provider: "stripe",
      code: err.code,
      message: err.message,
      httpStatus: err.httpStatus,
    };
  }

  return {
    action,
    provider: "stripe",
    code: "payment_provider_error",
    message: "Payment processing failed. Please try again later.",
    httpStatus: 502,
    type: "unknown",
  };
}

function mapStripeCode(err: Stripe.errors.StripeError): string {
  switch (err.code) {
    case "card_declined":
      return "card_declined";
    case "expired_card":
      return "expired_card";
    case "incorrect_cvc":
      return "incorrect_cvc";
    case "insufficient_funds":
      return "insufficient_funds";
    case "processing_error":
      return "processing_error";
    case "resource_missing":
      return "resource_not_found";
    case "rate_limit":
      return "rate_limited";
    case "authentication_required":
      return "authentication_required";
    default:
      break;
  }

  if (err instanceof Stripe.errors.StripeCardError) {
    return "card_declined";
  }
  if (err instanceof Stripe.errors.StripeInvalidRequestError) {
    return "invalid_request";
  }
  if (err instanceof Stripe.errors.StripeAuthenticationError) {
    return "provider_authentication_failed";
  }
  if (err instanceof Stripe.errors.StripeRateLimitError) {
    return "rate_limited";
  }
  if (err instanceof Stripe.errors.StripeConnectionError) {
    return "provider_unavailable";
  }

  return "payment_provider_error";
}

function userFriendlyMessage(err: Stripe.errors.StripeError): string {
  if (err instanceof Stripe.errors.StripeCardError) {
    switch (err.code) {
      case "expired_card":
        return "Your card has expired. Please use a different payment method.";
      case "incorrect_cvc":
        return "The security code is incorrect. Please check and try again.";
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
