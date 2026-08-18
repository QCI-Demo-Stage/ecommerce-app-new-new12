/**
 * Stripe payment provider adapter.
 * Creates customers, charges orders via PaymentIntents, and issues refunds.
 * Returns opaque provider tokens only — never raw card data or SDK error payloads.
 */

import type Stripe from "stripe";
import { PaymentError } from "../errors";
import {
  ConsolePaymentLogger,
  type PaymentLogger,
} from "../logger";
import type { RefundReason } from "../types";
import { mapStripeError } from "./mapStripeError";
import { createStripeClient } from "./stripeClient";
import type {
  PaymentProvider,
  ProviderChargeRequest,
  ProviderChargeResponse,
  ProviderCreateCustomerRequest,
  ProviderCreateCustomerResponse,
  ProviderRefundRequest,
  ProviderRefundResponse,
} from "./types";

export interface StripeAdapterOptions {
  /** Injected Stripe client (tests). Defaults to sandbox client from env. */
  stripe?: Stripe;
  logger?: PaymentLogger;
}

export class StripeAdapter implements PaymentProvider {
  readonly name = "stripe" as const;
  private readonly stripe: Stripe;
  private readonly logger: PaymentLogger;

  constructor(options: StripeAdapterOptions = {}) {
    this.stripe = options.stripe ?? createStripeClient();
    this.logger = options.logger ?? new ConsolePaymentLogger();
  }

  /**
   * Creates a Stripe Customer, optionally attaching the payment method token,
   * and returns the customer id for storage by the core payment service.
   */
  async createCustomer(
    request: ProviderCreateCustomerRequest,
  ): Promise<ProviderCreateCustomerResponse> {
    const action = "stripe.createCustomer";

    try {
      this.assertTokenized(request.paymentMethodToken);
      this.assertValidEmail(request.email);

      const customer = await this.stripe.customers.create({
        email: request.email,
        name: request.name,
        payment_method: request.paymentMethodToken,
        invoice_settings: {
          default_payment_method: request.paymentMethodToken,
        },
        metadata: request.metadata ?? {},
      });

      if (!customer.id) {
        throw new PaymentError(
          "provider_error",
          "Stripe did not return a customer token",
        );
      }

      this.logger.log({
        level: "info",
        action,
        result: "success",
        provider: "stripe",
        message: "Stripe customer created",
      });

      return {
        providerCustomerId: customer.id,
        paymentMethodToken: request.paymentMethodToken,
      };
    } catch (err) {
      if (err instanceof PaymentError) {
        this.logger.log({
          level: "error",
          action,
          result: "failure",
          provider: "stripe",
          errorCode: err.code,
          message: err.message,
        });
        throw err;
      }
      throw mapStripeError(err, action, this.logger);
    }
  }

  /**
   * Creates a PaymentIntent, confirms and captures payment, and returns a
   * payment token (payment_intent.id) for persistence by the core service.
   */
  async charge(request: ProviderChargeRequest): Promise<ProviderChargeResponse> {
    return this.chargeOrder(request);
  }

  /**
   * Story entry-point for order charging — creates, confirms, and captures
   * a PaymentIntent, then maps the response to the internal token format.
   */
  async chargeOrder(
    request: ProviderChargeRequest,
  ): Promise<ProviderChargeResponse> {
    const action = "stripe.chargeOrder";

    try {
      this.assertTokenized(request.paymentMethodToken);
      this.assertValidCharge(request);

      const createParams: Stripe.PaymentIntentCreateParams = {
        amount: request.amountCents,
        currency: request.currency.toLowerCase(),
        customer: request.providerCustomerId,
        payment_method: request.paymentMethodToken,
        description: request.description,
        metadata: { orderId: request.orderId },
        confirm: false,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      };

      const intent = await this.stripe.paymentIntents.create(
        createParams,
        request.idempotencyKey
          ? { idempotencyKey: `${request.idempotencyKey}:create` }
          : undefined,
      );

      const confirmed = await this.stripe.paymentIntents.confirm(
        intent.id,
        {
          payment_method: request.paymentMethodToken,
        },
        request.idempotencyKey
          ? { idempotencyKey: `${request.idempotencyKey}:confirm` }
          : undefined,
      );

      const status = this.mapIntentStatus(confirmed.status);
      if (status === "failed") {
        throw new PaymentError(
          "payment_required",
          "Payment could not be completed. Please try a different payment method.",
          { providerCode: confirmed.status },
        );
      }

      this.logger.log({
        level: "info",
        action,
        result: "success",
        provider: "stripe",
        orderId: request.orderId,
        message: "Stripe payment intent confirmed",
      });

      return {
        providerChargeId: confirmed.id,
        status,
      };
    } catch (err) {
      if (err instanceof PaymentError) {
        this.logger.log({
          level: "error",
          action,
          result: "failure",
          provider: "stripe",
          orderId: request.orderId,
          errorCode: err.code,
          message: err.message,
        });
        throw err;
      }
      throw mapStripeError(err, action, this.logger);
    }
  }

  /**
   * Refunds a previously captured payment (full or partial) via Stripe Refunds API.
   */
  async refund(request: ProviderRefundRequest): Promise<ProviderRefundResponse> {
    const action = "stripe.refund";

    try {
      if (!Number.isInteger(request.amountCents) || request.amountCents <= 0) {
        throw new PaymentError(
          "validation_error",
          "Refund amount must be a positive integer in the smallest currency unit.",
        );
      }
      if (!request.providerChargeId) {
        throw new PaymentError(
          "validation_error",
          "A valid payment token is required to refund an order.",
        );
      }

      const refund = await this.stripe.refunds.create(
        {
          payment_intent: request.providerChargeId,
          amount: request.amountCents,
          reason: toStripeRefundReason(request.reason),
        },
        request.idempotencyKey
          ? { idempotencyKey: request.idempotencyKey }
          : undefined,
      );

      this.logger.log({
        level: "info",
        action,
        result: "success",
        provider: "stripe",
        message: "Stripe refund created",
      });

      return {
        providerRefundId: refund.id,
        status: this.mapRefundStatus(refund.status),
      };
    } catch (err) {
      if (err instanceof PaymentError) {
        this.logger.log({
          level: "error",
          action,
          result: "failure",
          provider: "stripe",
          errorCode: err.code,
          message: err.message,
        });
        throw err;
      }
      throw mapStripeError(err, action, this.logger);
    }
  }

  private mapIntentStatus(
    status: Stripe.PaymentIntent.Status,
  ): ProviderChargeResponse["status"] {
    switch (status) {
      case "succeeded":
        return "succeeded";
      case "processing":
      case "requires_action":
      case "requires_confirmation":
      case "requires_capture":
        return "pending";
      case "canceled":
      case "requires_payment_method":
        return "failed";
      default:
        return "pending";
    }
  }

  private mapRefundStatus(
    status: string | null,
  ): ProviderRefundResponse["status"] {
    switch (status) {
      case "succeeded":
        return "succeeded";
      case "pending":
      case "requires_action":
        return "pending";
      case "failed":
      case "canceled":
        return "failed";
      default:
        return "pending";
    }
  }

  private assertValidEmail(email: string): void {
    if (!email?.includes("@")) {
      throw new PaymentError(
        "validation_error",
        "A valid customer email is required.",
      );
    }
  }

  private assertValidCharge(request: ProviderChargeRequest): void {
    if (!Number.isInteger(request.amountCents) || request.amountCents <= 0) {
      throw new PaymentError(
        "validation_error",
        "Charge amount must be a positive integer in the smallest currency unit.",
      );
    }
    if (!request.currency || request.currency.length !== 3) {
      throw new PaymentError(
        "validation_error",
        "A valid three-letter currency code is required.",
      );
    }
    if (!request.providerCustomerId) {
      throw new PaymentError(
        "validation_error",
        "A valid customer payment token is required.",
      );
    }
    if (!request.orderId) {
      throw new PaymentError(
        "validation_error",
        "An order id is required to charge an order.",
      );
    }
  }

  private assertTokenized(token: string): void {
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
}

function toStripeRefundReason(
  reason: RefundReason | undefined,
): Stripe.RefundCreateParams.Reason | undefined {
  switch (reason) {
    case "duplicate":
    case "fraudulent":
    case "requested_by_customer":
      return reason;
    default:
      // order_change / other are internal reasons — omit Stripe reason field
      return undefined;
  }
}
