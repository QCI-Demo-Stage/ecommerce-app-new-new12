import type {
  ChargeOrderInput,
  ChargeOrderResult,
  CreateCustomerInput,
  CreateCustomerResult,
  PaymentProviderName,
  RefundOrderInput,
  RefundOrderResult,
} from "./types";

/**
 * Core payment provider adapter contract.
 * Implementations (Stripe, PayPal, …) map provider APIs to opaque tokens.
 */
export interface PaymentProvider {
  readonly name: PaymentProviderName;

  createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResult>;

  chargeOrder(input: ChargeOrderInput): Promise<ChargeOrderResult>;

  refundOrder(input: RefundOrderInput): Promise<RefundOrderResult>;
}
