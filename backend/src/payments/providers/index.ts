import { PayPalAdapter } from "./paypalAdapter";
import { SimulatedStripeAdapter } from "./simulatedStripeAdapter";
import { StripeAdapter } from "./stripeAdapter";
import type { PaymentProvider } from "./types";
import type { PaymentProviderName } from "../types";
import { PaymentError } from "../errors";

export type { PaymentProvider } from "./types";
export { StripeAdapter } from "./stripeAdapter";
export { SimulatedStripeAdapter } from "./simulatedStripeAdapter";
export { PayPalAdapter } from "./paypalAdapter";
export { createStripeClient } from "./stripeClient";
export { mapStripeError, toStandardizedError } from "./mapStripeError";

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

const defaultProviders: Partial<Record<PaymentProviderName, PaymentProvider>> = {
  paypal: new PayPalAdapter(),
};

let stripeDefault: PaymentProvider | null = null;

function defaultStripeProvider(): PaymentProvider {
  if (!stripeDefault) {
    stripeDefault = createDefaultStripeAdapter();
  }
  return stripeDefault;
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
  const provider = defaultProviders[name];
  if (!provider) {
    throw new PaymentError("validation_error", `Unsupported provider: ${name}`);
  }
  return provider;
}
