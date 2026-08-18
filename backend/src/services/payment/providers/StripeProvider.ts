import { randomUUID } from "crypto";
import { PaymentError } from "../errors";
import type { PaymentProvider } from "./PaymentProvider";
import type {
  ChargeOrderInput,
  CreateCustomerInput,
  RefundInput,
} from "../types";
import type {
  ProviderCharge,
  ProviderCustomer,
  ProviderRefund,
} from "./PaymentProvider";

/** Stripe stub adapter — simulates API calls without network I/O. */
export class StripeProvider implements PaymentProvider {
  readonly name = "stripe" as const;

  async createCustomer(input: CreateCustomerInput): Promise<ProviderCustomer> {
    if (!input.email.includes("@")) {
      throw new PaymentError(
        "validation_error",
        "Invalid email for Stripe customer",
        400,
      );
    }
    return { providerCustomerId: `cus_stripe_${randomUUID().replace(/-/g, "").slice(0, 16)}` };
  }

  async charge(input: ChargeOrderInput): Promise<ProviderCharge> {
    if (input.paymentMethodToken.startsWith("pm_tok_decline")) {
      throw new PaymentError(
        "payment_declined",
        "The payment method was declined",
        402,
      );
    }
    if (input.paymentMethodToken.startsWith("pm_tok_error")) {
      throw new PaymentError(
        "provider_error",
        "Stripe provider unavailable",
        502,
      );
    }
    return {
      chargeId: `ch_stripe_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
      status: "succeeded",
      amountCents: input.amountCents,
      currency: input.currency,
    };
  }

  async refund(
    input: RefundInput & { amountCents: number; currency: string },
  ): Promise<ProviderRefund> {
    if (input.chargeId.startsWith("ch_missing")) {
      throw new PaymentError("not_found", "Charge not found at Stripe", 404);
    }
    return {
      refundId: `re_stripe_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
      chargeId: input.chargeId,
      amountCents: input.amountCents,
      currency: input.currency,
      status: "succeeded",
    };
  }
}
