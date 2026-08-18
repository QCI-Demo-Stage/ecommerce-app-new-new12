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

/** PayPal stub adapter — simulates API calls without network I/O. */
export class PayPalProvider implements PaymentProvider {
  readonly name = "paypal" as const;

  async createCustomer(input: CreateCustomerInput): Promise<ProviderCustomer> {
    if (!input.email.includes("@")) {
      throw new PaymentError(
        "validation_error",
        "Invalid email for PayPal customer",
        400,
      );
    }
    return { providerCustomerId: `PAYPAL-CUS-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}` };
  }

  async charge(input: ChargeOrderInput): Promise<ProviderCharge> {
    if (input.paymentMethodToken.startsWith("PAYPAL_DECLINE")) {
      throw new PaymentError(
        "payment_declined",
        "The payment method was declined",
        402,
      );
    }
    if (input.paymentMethodToken.startsWith("PAYPAL_ERROR")) {
      throw new PaymentError(
        "provider_error",
        "PayPal provider unavailable",
        502,
      );
    }
    return {
      chargeId: `PAYPAL-CAP-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
      status: "succeeded",
      amountCents: input.amountCents,
      currency: input.currency,
    };
  }

  async refund(
    input: RefundInput & { amountCents: number; currency: string },
  ): Promise<ProviderRefund> {
    if (input.chargeId.startsWith("PAYPAL-MISSING")) {
      throw new PaymentError("not_found", "Capture not found at PayPal", 404);
    }
    return {
      refundId: `PAYPAL-REF-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
      chargeId: input.chargeId,
      amountCents: input.amountCents,
      currency: input.currency,
      status: "succeeded",
    };
  }
}
