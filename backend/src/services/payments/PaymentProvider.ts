import type {
  ChargeOrderInput,
  ChargeResult,
  CustomerInput,
  PaymentProviderName,
  PaymentToken,
  RefundOrderInput,
  RefundResult,
} from "./types";

/**
 * Core payment provider abstraction.
 * Adapters (Stripe, PayPal, …) implement this contract; the PaymentService
 * orchestrates calls and persists returned tokens.
 */
export interface PaymentProvider {
  readonly name: PaymentProviderName;

  createCustomer(input: CustomerInput): Promise<PaymentToken>;

  chargeOrder(input: ChargeOrderInput): Promise<ChargeResult>;

  refundOrder(input: RefundOrderInput): Promise<RefundResult>;
}
