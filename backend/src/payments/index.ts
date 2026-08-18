export type { PaymentProvider } from "./PaymentProvider";
export { PaymentService } from "./PaymentService";
export { PaymentError, type PaymentErrorCode } from "./errors";
export {
  paymentTokenStore,
  PaymentTokenStore,
} from "./tokenStore";
export type {
  ChargeOrderInput,
  ChargeOrderResult,
  CreateCustomerInput,
  CreateCustomerResult,
  PaymentProviderName,
  PaymentToken,
  RefundOrderInput,
  RefundOrderResult,
  TokenKind,
} from "./types";
export { StripeAdapter, stripeAdapter } from "./stripe/StripeAdapter";
export { mapStripeError } from "./stripe/mapStripeError";
export {
  createStripeClient,
  getStripeClient,
  resetStripeClientForTests,
} from "./stripe/stripeClient";

import { PaymentService } from "./PaymentService";
import { paymentTokenStore } from "./tokenStore";
import { stripeAdapter } from "./stripe/StripeAdapter";

/** Default payment service wired to Stripe + in-memory token store. */
export function createPaymentService(): PaymentService {
  return new PaymentService(stripeAdapter, paymentTokenStore);
}

export const paymentService = createPaymentService();
