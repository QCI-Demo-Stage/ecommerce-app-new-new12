/**
 * Stripe payment provider stub.
 * Real Stripe SDK calls will replace these simulated responses.
 */

import { randomUUID } from "node:crypto";
import { PaymentError } from "../errors";
import type {
  PaymentProvider,
  ProviderChargeRequest,
  ProviderChargeResponse,
  ProviderCreateCustomerRequest,
  ProviderCreateCustomerResponse,
  ProviderRefundRequest,
  ProviderRefundResponse,
} from "./types";

export class StripeAdapter implements PaymentProvider {
  readonly name = "stripe" as const;

  async createCustomer(
    request: ProviderCreateCustomerRequest,
  ): Promise<ProviderCreateCustomerResponse> {
    assertTokenized(request.paymentMethodToken, "stripe");
    return {
      providerCustomerId: `cus_stripe_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
      paymentMethodToken: request.paymentMethodToken,
    };
  }

  async charge(request: ProviderChargeRequest): Promise<ProviderChargeResponse> {
    assertTokenized(request.paymentMethodToken, "stripe");
    if (request.amountCents <= 0) {
      throw new PaymentError("validation_error", "amountCents must be positive");
    }
    // Simulate a declined card for deterministic testing when token ends with _decline
    if (request.paymentMethodToken.endsWith("_decline")) {
      throw new PaymentError("payment_required", "Card was declined", {
        providerCode: "card_declined",
      });
    }
    return {
      providerChargeId: `ch_stripe_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
      status: "succeeded",
    };
  }

  async refund(request: ProviderRefundRequest): Promise<ProviderRefundResponse> {
    if (request.amountCents <= 0) {
      throw new PaymentError("validation_error", "amountCents must be positive");
    }
    return {
      providerRefundId: `re_stripe_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
      status: "succeeded",
    };
  }
}

function assertTokenized(token: string, provider: string): void {
  // Reject values that look like raw PANs (digits only, 13–19 length)
  if (/^\d{13,19}$/.test(token.replace(/[\s-]/g, ""))) {
    throw new PaymentError(
      "validation_error",
      `Raw card numbers are not accepted by the ${provider} adapter`,
      {
        details: [
          {
            path: "paymentMethodToken",
            message: "Provide a provider-issued token, not a card number",
          },
        ],
      },
    );
  }
}
