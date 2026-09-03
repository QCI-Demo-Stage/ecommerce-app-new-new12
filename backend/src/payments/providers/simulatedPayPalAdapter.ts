/**
 * Offline PayPal adapter for unit tests and local runs without credentials.
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

export class SimulatedPayPalAdapter implements PaymentProvider {
  readonly name = "paypal" as const;

  async createCustomer(
    request: ProviderCreateCustomerRequest,
  ): Promise<ProviderCreateCustomerResponse> {
    assertTokenized(request.paymentMethodToken);
    return {
      providerCustomerId: `PAYPAL-CUS-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
      paymentMethodToken: request.paymentMethodToken,
    };
  }

  async charge(request: ProviderChargeRequest): Promise<ProviderChargeResponse> {
    return this.chargeOrder(request);
  }

  /**
   * Simulated create + capture — returns a synthetic PayPal order ID.
   */
  async chargeOrder(
    request: ProviderChargeRequest,
  ): Promise<ProviderChargeResponse> {
    assertTokenized(request.paymentMethodToken);
    if (request.amountCents <= 0) {
      throw new PaymentError("validation_error", "amountCents must be positive");
    }
    if (request.paymentMethodToken.endsWith("_decline")) {
      throw new PaymentError("payment_required", "Instrument declined", {
        providerCode: "INSTRUMENT_DECLINED",
      });
    }
    return {
      providerChargeId: `PAYPAL-ORD-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
      status: "succeeded",
    };
  }

  async refund(request: ProviderRefundRequest): Promise<ProviderRefundResponse> {
    if (request.amountCents <= 0) {
      throw new PaymentError("validation_error", "amountCents must be positive");
    }
    return {
      providerRefundId: `PAYPAL-RE-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
      status: "succeeded",
    };
  }
}

function assertTokenized(token: string): void {
  if (/^\d{13,19}$/.test(token.replace(/[\s-]/g, ""))) {
    throw new PaymentError(
      "validation_error",
      "Raw card numbers are not accepted by the paypal adapter",
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
