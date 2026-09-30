import type Stripe from "stripe";
import { logger } from "../../../utils/logger";
import type { PaymentProvider } from "../PaymentProvider";
import type {
  ChargeOrderInput,
  ChargeResult,
  CustomerInput,
  PaymentToken,
  RefundOrderInput,
  RefundResult,
} from "../types";
import { PaymentError } from "../types";
import { mapStripeError } from "./mapStripeError";
import { createStripeClient } from "./stripeClient";

/**
 * Stripe payment provider adapter.
 * Creates customers, charges orders via PaymentIntents, and issues refunds.
 * Returns opaque tokens only — never raw card data or SDK error payloads.
 */
export class StripeAdapter implements PaymentProvider {
  readonly name = "stripe" as const;
  private readonly stripe: Stripe;

  constructor(stripeClient?: Stripe) {
    this.stripe = stripeClient ?? createStripeClient();
  }

  /**
   * Creates a Stripe Customer and returns an opaque customer token (customer.id)
   * for storage by the core payment service.
   */
  async createCustomer(input: CustomerInput): Promise<PaymentToken> {
    const action = "stripe.createCustomer";

    try {
      this.assertValidCustomerInput(input);

      logger.info("Creating Stripe customer", {
        action,
        provider: "stripe",
        userId: input.userId,
        result: undefined,
        meta: { hasEmail: Boolean(input.email) },
      });

      const customer = await this.stripe.customers.create({
        email: input.email,
        name: input.name,
        metadata: {
          userId: input.userId,
          ...(input.metadata ?? {}),
        },
      });

      const token: PaymentToken = {
        provider: "stripe",
        kind: "customer",
        token: customer.id,
        createdAt: new Date((customer.created ?? Date.now() / 1000) * 1000),
        references: { userId: input.userId },
      };

      logger.info("Stripe customer created", {
        action,
        provider: "stripe",
        userId: input.userId,
        result: "success",
        meta: { tokenKind: "customer" },
      });

      return token;
    } catch (err) {
      if (err instanceof PaymentError) {
        logger.logStandardizedError({
          action,
          provider: "stripe",
          code: err.code,
          message: err.message,
          httpStatus: err.httpStatus,
        });
        throw err;
      }
      throw mapStripeError(err, action);
    }
  }

  /**
   * Creates a PaymentIntent, confirms it, and captures payment.
   * Maps the confirmed intent id to an internal payment token.
   */
  async chargeOrder(input: ChargeOrderInput): Promise<ChargeResult> {
    const action = "stripe.chargeOrder";

    try {
      this.assertValidChargeInput(input);

      logger.info("Creating Stripe payment intent", {
        action,
        provider: "stripe",
        result: undefined,
        meta: {
          orderId: input.orderId,
          amount: input.amount,
          currency: input.currency.toLowerCase(),
        },
      });

      const intent = await this.stripe.paymentIntents.create({
        amount: input.amount,
        currency: input.currency.toLowerCase(),
        customer: input.customerToken,
        payment_method: input.paymentMethodToken,
        description: input.description,
        metadata: {
          orderId: input.orderId,
          ...(input.metadata ?? {}),
        },
        confirm: false,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      });

      const confirmed = await this.stripe.paymentIntents.confirm(intent.id, {
        payment_method: input.paymentMethodToken,
      });

      const status = this.mapIntentStatus(confirmed.status);
      if (status !== "succeeded" && status !== "processing") {
        throw new PaymentError({
          code: "payment_not_completed",
          message:
            "Payment could not be completed. Please try a different payment method.",
          httpStatus: 402,
          provider: "stripe",
        });
      }

      const paymentToken: PaymentToken = {
        provider: "stripe",
        kind: "payment",
        token: confirmed.id,
        createdAt: new Date((confirmed.created ?? Date.now() / 1000) * 1000),
        references: {
          orderId: input.orderId,
          customerToken: input.customerToken,
        },
      };

      logger.info("Stripe payment intent confirmed", {
        action,
        provider: "stripe",
        result: "success",
        meta: {
          orderId: input.orderId,
          status,
          tokenKind: "payment",
        },
      });

      return {
        paymentToken,
        status,
        amount: confirmed.amount,
        currency: confirmed.currency,
      };
    } catch (err) {
      if (err instanceof PaymentError) {
        logger.logStandardizedError({
          action,
          provider: "stripe",
          code: err.code,
          message: err.message,
          httpStatus: err.httpStatus,
        });
        throw err;
      }
      throw mapStripeError(err, action);
    }
  }

  /**
   * Refunds a previously captured payment (full or partial).
   */
  async refundOrder(input: RefundOrderInput): Promise<RefundResult> {
    const action = "stripe.refundOrder";

    try {
      this.assertValidRefundInput(input);

      logger.info("Creating Stripe refund", {
        action,
        provider: "stripe",
        result: undefined,
        meta: {
          orderId: input.orderId,
          hasPartialAmount: input.amount !== undefined,
        },
      });

      const refund = await this.stripe.refunds.create({
        payment_intent: input.paymentToken,
        amount: input.amount,
        reason: input.reason,
        metadata: { orderId: input.orderId },
      });

      const refundToken: PaymentToken = {
        provider: "stripe",
        kind: "refund",
        token: refund.id,
        createdAt: new Date((refund.created ?? Date.now() / 1000) * 1000),
        references: {
          orderId: input.orderId,
          paymentToken: input.paymentToken,
        },
      };

      logger.info("Stripe refund created", {
        action,
        provider: "stripe",
        result: "success",
        meta: {
          orderId: input.orderId,
          status: refund.status ?? "unknown",
          tokenKind: "refund",
        },
      });

      return {
        refundToken,
        status: this.mapRefundStatus(refund.status),
        amount: refund.amount,
        currency: refund.currency,
      };
    } catch (err) {
      if (err instanceof PaymentError) {
        logger.logStandardizedError({
          action,
          provider: "stripe",
          code: err.code,
          message: err.message,
          httpStatus: err.httpStatus,
        });
        throw err;
      }
      throw mapStripeError(err, action);
    }
  }

  private mapIntentStatus(
    status: Stripe.PaymentIntent.Status,
  ): ChargeResult["status"] {
    switch (status) {
      case "succeeded":
        return "succeeded";
      case "processing":
        return "processing";
      case "canceled":
        return "canceled";
      case "requires_action":
      case "requires_confirmation":
      case "requires_payment_method":
      case "requires_capture":
        return "requires_action";
      default:
        return "requires_action";
    }
  }

  private mapRefundStatus(
    status: string | null,
  ): RefundResult["status"] {
    switch (status) {
      case "succeeded":
        return "succeeded";
      case "pending":
        return "pending";
      case "failed":
        return "failed";
      case "canceled":
        return "canceled";
      default:
        return "pending";
    }
  }

  private assertValidCustomerInput(input: CustomerInput): void {
    if (!input.email?.includes("@")) {
      throw new PaymentError({
        code: "invalid_customer",
        message: "A valid customer email is required.",
        httpStatus: 400,
        provider: "stripe",
      });
    }
    if (!input.userId) {
      throw new PaymentError({
        code: "invalid_customer",
        message: "A user id is required to create a payment customer.",
        httpStatus: 400,
        provider: "stripe",
      });
    }
  }

  private assertValidChargeInput(input: ChargeOrderInput): void {
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new PaymentError({
        code: "invalid_amount",
        message: "Charge amount must be a positive integer in the smallest currency unit.",
        httpStatus: 400,
        provider: "stripe",
      });
    }
    if (!input.currency || input.currency.length !== 3) {
      throw new PaymentError({
        code: "invalid_currency",
        message: "A valid three-letter currency code is required.",
        httpStatus: 400,
        provider: "stripe",
      });
    }
    if (!input.customerToken?.startsWith("cus_")) {
      throw new PaymentError({
        code: "invalid_customer_token",
        message: "A valid customer payment token is required.",
        httpStatus: 400,
        provider: "stripe",
      });
    }
    if (!input.paymentMethodToken?.startsWith("pm_")) {
      throw new PaymentError({
        code: "invalid_payment_method",
        message: "A valid payment method token is required.",
        httpStatus: 400,
        provider: "stripe",
      });
    }
    if (!input.orderId) {
      throw new PaymentError({
        code: "invalid_order",
        message: "An order id is required to charge an order.",
        httpStatus: 400,
        provider: "stripe",
      });
    }
  }

  private assertValidRefundInput(input: RefundOrderInput): void {
    if (!input.paymentToken?.startsWith("pi_")) {
      throw new PaymentError({
        code: "invalid_payment_token",
        message: "A valid payment token is required to refund an order.",
        httpStatus: 400,
        provider: "stripe",
      });
    }
    if (
      input.amount !== undefined &&
      (!Number.isInteger(input.amount) || input.amount <= 0)
    ) {
      throw new PaymentError({
        code: "invalid_amount",
        message: "Refund amount must be a positive integer when provided.",
        httpStatus: 400,
        provider: "stripe",
      });
    }
    if (!input.orderId) {
      throw new PaymentError({
        code: "invalid_order",
        message: "An order id is required to refund an order.",
        httpStatus: 400,
        provider: "stripe",
      });
    }
  }
}
