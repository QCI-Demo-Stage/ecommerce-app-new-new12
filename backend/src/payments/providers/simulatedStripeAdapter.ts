/**
 * Simulated Stripe adapter for unit tests without live Stripe credentials.
 * Production code paths use StripeAdapter with the official SDK.
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

export class SimulatedStripeAdapter implements PaymentProvider {
  readonly name = "stripe" as const;

  async createCustomer(
    request: ProviderCreateCustomerRequest,
  ): Promise<ProviderCreateCustomerResponse> {
    assertTokenized(request.paymentMethodToken);
    return {
      providerCustomerId: `cus_stripe_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
      paymentMethodToken: request.paymentMethodToken,
    };
  }

  async charge(request: ProviderChargeRequest): Promise<ProviderChargeResponse> {
    assertTokenized(request.paymentMethodToken);
    if (request.amountCents <= 0) {
      throw new PaymentError("validation_error", "amountCents must be positive");
    }
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

  /** Story-aligned alias for charge-order flows used by tests and docs. */
  async chargeOrder(
    request: ProviderChargeRequest,
  ): Promise<ProviderChargeResponse> {
    return this.charge(request);
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

function assertTokenized(token: string): void {
  if (/^\d{13,19}$/.test(token.replace(/[\s-]/g, ""))) {
    throw new PaymentError(
      "validation_error",
      "Raw card numbers are not accepted by the stripe adapter",
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
