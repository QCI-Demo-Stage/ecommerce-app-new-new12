import Stripe from "stripe";
import { PaymentError } from "../errors";

/**
 * Instantiates a Stripe client using sandbox/test keys from the environment.
 * Secret keys must never be hardcoded or committed.
 */
export function createStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new PaymentError({
      code: "configuration_error",
      userMessage: "Payment service is not configured",
      httpStatus: 503,
      provider: "stripe",
    });
  }

  // Prefer test/sandbox keys in non-production; allow live keys only when NODE_ENV=production
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd && !secretKey.startsWith("sk_test_")) {
    throw new PaymentError({
      code: "configuration_error",
      userMessage: "Payment service is not configured for sandbox",
      httpStatus: 503,
      provider: "stripe",
    });
  }

  // apiVersion defaults to the SDK-bundled version (see stripe package ApiVersion)
  return new Stripe(secretKey, {
    typescript: true,
    maxNetworkRetries: 2,
    timeout: 20_000,
  });
}

/** Lazy singleton — created on first use so boot does not require Stripe keys. */
let cached: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!cached) {
    cached = createStripeClient();
  }
  return cached;
}

/** Test-only: reset the cached client. */
export function resetStripeClientForTests(): void {
  cached = null;
}
