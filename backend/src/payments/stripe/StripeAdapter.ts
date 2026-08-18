import type Stripe from "stripe";
import type { PaymentProvider } from "../PaymentProvider";
import { PaymentError } from "../errors";
import type {
  ChargeOrderInput,
  ChargeOrderResult,
  CreateCustomerInput,
  CreateCustomerResult,
  RefundOrderInput,
  RefundOrderResult,
} from "../types";
import { logger } from "../../utils/logger";
import { mapStripeError } from "./mapStripeError";
import { getStripeClient } from "./stripeClient";

/**
 * Stripe payment provider adapter.
 * Returns opaque tokens (customer.id / payment_intent.id / refund.id)
 * for the core PaymentService to persist — never raw card data.
 */
export class StripeAdapter implements PaymentProvider {
  readonly name = "stripe" as const;

  private client(): Stripe {
    return getStripeClient();
  }

  /**
   * Creates a Stripe Customer and returns the customer id as a storage token.
   */
  async createCustomer(
    input: CreateCustomerInput,
  ): Promise<CreateCustomerResult> {
    const action = "stripe.createCustomer";
    try {
      logger.debug("Calling Stripe customers.create", {
        action,
        provider: "stripe",
        userId: input.userId,
      });

      const customer = await this.client().customers.create({
        email: input.email,
        name: input.name,
        phone: input.phone,
        metadata: {
          userId: input.userId,
        },
      });

      if (!customer.id) {
        throw new PaymentError({
          code: "customer_error",
          userMessage: "Unable to create payment customer",
          httpStatus: 502,
          provider: "stripe",
        });
      }

      return {
        customerToken: customer.id,
        provider: "stripe",
      };
    } catch (err) {
      throw mapStripeError(err, action);
    }
  }

  /**
   * Creates a PaymentIntent, confirms it (captures when automatic),
   * and returns the payment intent id as the payment token.
   */
  async chargeOrder(input: ChargeOrderInput): Promise<ChargeOrderResult> {
    const action = "stripe.chargeOrder";
    try {
      logger.debug("Calling Stripe paymentIntents.create", {
        action,
        provider: "stripe",
        orderId: input.orderId,
        amount: input.amount,
        currency: input.currency.toLowerCase(),
      });

      const intent = await this.client().paymentIntents.create({
        amount: input.amount,
        currency: input.currency.toLowerCase(),
        customer: input.customerToken,
        payment_method: input.paymentMethodToken,
        description: input.description,
        metadata: {
          orderId: input.orderId,
          userId: input.userId,
        },
        confirm: false,
        capture_method: "automatic",
        // Server-side confirmation; disable redirects for API-only flow
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      });

      logger.debug("Calling Stripe paymentIntents.confirm", {
        action,
        provider: "stripe",
        orderId: input.orderId,
      });

      const confirmed = await this.client().paymentIntents.confirm(intent.id, {
        payment_method: input.paymentMethodToken,
      });

      const paymentToken = confirmed.id;
      if (!paymentToken) {
        throw new PaymentError({
          code: "payment_failed",
          userMessage: "Payment could not be completed",
          httpStatus: 502,
          provider: "stripe",
        });
      }

      return {
        paymentToken,
        status: mapIntentStatus(confirmed.status),
        provider: "stripe",
        amount: confirmed.amount,
        currency: confirmed.currency,
      };
    } catch (err) {
      throw mapStripeError(err, action);
    }
  }

  /**
   * Refunds a previously charged PaymentIntent (full or partial).
   */
  async refundOrder(input: RefundOrderInput): Promise<RefundOrderResult> {
    const action = "stripe.refundOrder";
    try {
      logger.debug("Calling Stripe refunds.create", {
        action,
        provider: "stripe",
        orderId: input.orderId,
      });

      const refund = await this.client().refunds.create({
        payment_intent: input.paymentToken,
        amount: input.amount,
        reason: input.reason,
        metadata: {
          orderId: input.orderId,
          userId: input.userId,
        },
      });

      if (!refund.id) {
        throw new PaymentError({
          code: "refund_error",
          userMessage: "Refund could not be completed",
          httpStatus: 502,
          provider: "stripe",
        });
      }

      return {
        refundToken: refund.id,
        status: mapRefundStatus(refund.status),
        provider: "stripe",
        amount: refund.amount ?? null,
      };
    } catch (err) {
      throw mapStripeError(err, action);
    }
  }
}

function mapIntentStatus(
  status: Stripe.PaymentIntent.Status,
): ChargeOrderResult["status"] {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "processing":
      return "processing";
    case "requires_action":
    case "requires_confirmation":
    case "requires_payment_method":
      return "requires_action";
    case "canceled":
    default:
      return "failed";
  }
}

function mapRefundStatus(
  status: string | null,
): RefundOrderResult["status"] {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "pending":
      return "pending";
    case "canceled":
      return "canceled";
    case "failed":
    default:
      return "failed";
  }
}

export const stripeAdapter = new StripeAdapter();
