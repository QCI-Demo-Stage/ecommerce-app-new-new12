import Stripe from "stripe";

/**
 * Instantiates the Stripe client with sandbox / test keys from the environment.
 * Never hard-code secret keys; load only from approved env configuration.
 */
export function createStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY must be set (use Stripe test/sandbox key for non-production)",
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    secretKey.startsWith("sk_test_")
  ) {
    throw new Error(
      "Refusing to use a Stripe test key when NODE_ENV is production",
    );
  }

  if (
    process.env.NODE_ENV !== "production" &&
    !secretKey.startsWith("sk_test_") &&
    !secretKey.startsWith("sk_live_")
  ) {
    throw new Error(
      "STRIPE_SECRET_KEY must be a valid Stripe secret key (sk_test_… for sandbox)",
    );
  }

  return new Stripe(secretKey, {
    apiVersion: "2026-07-29.dahlia",
    typescript: true,
    maxNetworkRetries: 2,
    timeout: 20_000,
    appInfo: {
      name: "Ecommerce App New",
      version: process.env.APP_VERSION ?? "0.0.0",
    },
  });
}
