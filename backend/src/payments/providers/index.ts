import { PayPalAdapter } from "./paypalAdapter";
import { StripeAdapter } from "./stripeAdapter";
import type { PaymentProvider } from "./types";
import type { PaymentProviderName } from "../types";
import { PaymentError } from "../errors";

export type { PaymentProvider } from "./types";
export { StripeAdapter } from "./stripeAdapter";
export { PayPalAdapter } from "./paypalAdapter";

const defaultProviders: Record<PaymentProviderName, PaymentProvider> = {
  stripe: new StripeAdapter(),
  paypal: new PayPalAdapter(),
};

export function getProvider(
  name: PaymentProviderName,
  overrides?: Partial<Record<PaymentProviderName, PaymentProvider>>,
): PaymentProvider {
  const provider = overrides?.[name] ?? defaultProviders[name];
  if (!provider) {
    throw new PaymentError("validation_error", `Unsupported provider: ${name}`);
  }
  return provider;
}
