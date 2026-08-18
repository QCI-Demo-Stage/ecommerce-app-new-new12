import type {
  ChargeOrderInput,
  ChargeOrderResult,
  CreateCustomerInput,
  CreateCustomerResult,
  RefundOrderInput,
  RefundOrderResult,
} from "./types";

/**
 * Payment provider adapter contract used by the core PaymentService.
 * Implementations (Stripe, PayPal, …) must return opaque tokens only —
 * never raw card data or provider error payloads.
 */
export interface PaymentProvider {
  readonly name: "stripe" | "paypal";

  createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResult>;

  chargeOrder(input: ChargeOrderInput): Promise<ChargeOrderResult>;

  refundOrder(input: RefundOrderInput): Promise<RefundOrderResult>;
}
