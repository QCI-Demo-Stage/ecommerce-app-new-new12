import { PayPalAdapter } from "./paypalAdapter";
import { SimulatedPayPalAdapter } from "./simulatedPayPalAdapter";
import { SimulatedStripeAdapter } from "./simulatedStripeAdapter";
import { StripeAdapter } from "./stripeAdapter";
import type { PaymentProvider } from "./types";
import type { PaymentProviderName } from "../types";
import { PaymentError } from "../errors";
import { hasPayPalCredentials } from "./paypalClient";

export type { PaymentProvider } from "./types";
export { StripeAdapter } from "./stripeAdapter";
export { SimulatedStripeAdapter } from "./simulatedStripeAdapter";
export { PayPalAdapter } from "./paypalAdapter";
export { SimulatedPayPalAdapter } from "./simulatedPayPalAdapter";
export { createStripeClient } from "./stripeClient";
export { createPayPalControllers, hasPayPalCredentials } from "./paypalClient";
export { mapStripeError, toStandardizedError } from "./mapStripeError";
export { mapPayPalError } from "./mapPayPalError";
export { centsToPayPalAmount } from "./paypalAdapter";

/**
 * Resolves the Stripe adapter: real SDK when STRIPE_SECRET_KEY is set,
 * otherwise a simulated adapter (unit tests / local without credentials).
 */
export function createDefaultStripeAdapter(): PaymentProvider {
  if (process.env.STRIPE_SECRET_KEY) {
    return new StripeAdapter();
  }
  return new SimulatedStripeAdapter();
}

/**
 * Resolves the PayPal adapter: real Server SDK when credentials are set,
 * otherwise a simulated adapter for offline unit tests.
 */
export function createDefaultPayPalAdapter(): PaymentProvider {
  if (hasPayPalCredentials()) {
    return new PayPalAdapter();
  }
  return new SimulatedPayPalAdapter();
}

let stripeDefault: PaymentProvider | null = null;
let paypalDefault: PaymentProvider | null = null;

function defaultStripeProvider(): PaymentProvider {
  if (!stripeDefault) {
    stripeDefault = createDefaultStripeAdapter();
  }
  return stripeDefault;
}

function defaultPayPalProvider(): PaymentProvider {
  if (!paypalDefault) {
    paypalDefault = createDefaultPayPalAdapter();
  }
  return paypalDefault;
}

export function getProvider(
  name: PaymentProviderName,
  overrides?: Partial<Record<PaymentProviderName, PaymentProvider>>,
): PaymentProvider {
  if (overrides?.[name]) {
    return overrides[name]!;
  }
  if (name === "stripe") {
    return defaultStripeProvider();
  }
  if (name === "paypal") {
    return defaultPayPalProvider();
  }
  throw new PaymentError("validation_error", `Unsupported provider: ${name}`);
}
