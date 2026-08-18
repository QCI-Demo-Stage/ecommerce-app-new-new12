import Stripe from "stripe";
import { logger } from "../utils/logger";
import { mapStripeError, PaymentError } from "./errors";
import type { PaymentProvider } from "./PaymentProvider";
import type {
  ChargeOrderInput,
  ChargeOrderResult,
  CreateCustomerInput,
  CreateCustomerResult,
  RefundOrderInput,
  RefundOrderResult,
} from "./types";

/**
 * Stripe payment adapter. Uses sandbox/test keys via STRIPE_SECRET_KEY
 * (sk_test_…). All SDK calls are wrapped; raw errors are mapped and never
 * persisted.
 */
export class StripeAdapter implements PaymentProvider {
  readonly name = "stripe" as const;
  private readonly stripe: Stripe;

  constructor(stripeClient?: Stripe) {
    this.stripe = stripeClient ?? createStripeClient();
  }

  /**
   * Creates a Stripe Customer and returns an opaque customer token (cus_…)
   * for storage by the core payment service.
   */
  async createCustomer(
    input: CreateCustomerInput,
  ): Promise<CreateCustomerResult> {
    const operation = "stripe.createCustomer";
    try {
      validateEmail(input.email);

      logger.info("Creating Stripe customer", {
        operation,
        provider: "stripe",
        meta: { hasUserId: Boolean(input.userId) },
      });

      const customer = await this.stripe.customers.create({
        email: input.email,
        name: input.name,
        metadata: {
          ...(input.metadata ?? {}),
          ...(input.userId ? { userId: input.userId } : {}),
        },
      });

      if (!customer.id) {
        throw new PaymentError({
          code: "payment_provider_error",
          message: "Stripe customer create returned no id",
          userMessage:
            "We could not set up your payment profile. Please try again.",
          statusCode: 502,
          provider: "stripe",
        });
      }

      logger.info("Stripe customer created", {
        operation,
        provider: "stripe",
        meta: { customerTokenPrefix: customer.id.slice(0, 7) },
      });

      return {
        customerToken: customer.id,
        provider: "stripe",
      };
    } catch (err) {
      const mapped = mapStripeError(err, "createCustomer");
      logger.error("Stripe createCustomer failed", {
        operation,
        provider: "stripe",
        meta: mapped.toLogObject(),
      });
      throw mapped;
    }
  }

  /**
   * Creates a PaymentIntent, confirms it, captures funds (when requested),
   * and returns an opaque payment token (pi_…) for persistence.
   */
  async chargeOrder(input: ChargeOrderInput): Promise<ChargeOrderResult> {
    const operation = "stripe.chargeOrder";
    try {
      validateChargeInput(input);

      const capture = input.capture !== false;
      const currency = input.currency.toLowerCase();

      logger.info("Creating Stripe payment intent", {
        operation,
        provider: "stripe",
        meta: {
          amount: input.amount,
          currency,
          capture,
          hasOrderId: Boolean(input.orderId),
        },
      });

      const intent = await this.stripe.paymentIntents.create({
        amount: input.amount,
        currency,
        customer: input.customerToken,
        payment_method: input.paymentMethodId,
        confirm: true,
        off_session: true,
        capture_method: capture ? "automatic" : "manual",
        description: input.description,
        metadata: {
          ...(input.metadata ?? {}),
          ...(input.orderId ? { orderId: input.orderId } : {}),
        },
      });

      // Manual capture path: leave funds authorized until a later capture call.
      // Automatic path confirms + captures in one step via capture_method.
      const finalIntent = intent;

      if (
        finalIntent.status !== "succeeded" &&
        finalIntent.status !== "requires_capture"
      ) {
        throw new PaymentError({
          code: "payment_not_completed",
          message: `Stripe payment intent status=${finalIntent.status}`,
          userMessage:
            "Payment could not be completed. Please try another method.",
          statusCode: 402,
          provider: "stripe",
          retryable: false,
        });
      }

      // When automatic capture was requested but intent still needs capture, capture now
      let settled = finalIntent;
      if (capture && finalIntent.status === "requires_capture" && finalIntent.id) {
        settled = await this.stripe.paymentIntents.capture(finalIntent.id);
      }

      if (capture && settled.status !== "succeeded") {
        throw new PaymentError({
          code: "payment_not_completed",
          message: `Stripe payment intent status=${settled.status}`,
          userMessage:
            "Payment could not be completed. Please try another method.",
          statusCode: 402,
          provider: "stripe",
          retryable: false,
        });
      }

      logger.info("Stripe charge completed", {
        operation,
        provider: "stripe",
        meta: {
          status: settled.status,
          amount: settled.amount,
          currency: settled.currency,
        },
      });

      return {
        paymentToken: settled.id,
        status: settled.status,
        amount: settled.amount,
        currency: settled.currency,
        provider: "stripe",
      };
    } catch (err) {
      const mapped = mapStripeError(err, "chargeOrder");
      logger.error("Stripe chargeOrder failed", {
        operation,
        provider: "stripe",
        meta: mapped.toLogObject(),
      });
      throw mapped;
    }
  }

  /**
   * Refunds a previously charged payment intent (full or partial).
   */
  async refundOrder(input: RefundOrderInput): Promise<RefundOrderResult> {
    const operation = "stripe.refundOrder";
    try {
      if (!input.paymentToken || !input.paymentToken.startsWith("pi_")) {
        throw new PaymentError({
          code: "invalid_payment_request",
          message: "refundOrder requires a Stripe payment intent token",
          userMessage: "Invalid payment reference for refund.",
          statusCode: 400,
          provider: "stripe",
        });
      }

      logger.info("Creating Stripe refund", {
        operation,
        provider: "stripe",
        meta: {
          hasAmount: typeof input.amount === "number",
          reason: input.reason ?? null,
        },
      });

      const refund = await this.stripe.refunds.create({
        payment_intent: input.paymentToken,
        ...(typeof input.amount === "number" ? { amount: input.amount } : {}),
        ...(input.reason ? { reason: input.reason } : {}),
        metadata: input.metadata,
      });

      logger.info("Stripe refund created", {
        operation,
        provider: "stripe",
        meta: {
          status: refund.status ?? "unknown",
          amount: refund.amount ?? null,
        },
      });

      return {
        refundToken: refund.id,
        paymentToken: input.paymentToken,
        status: refund.status ?? "unknown",
        amount: refund.amount ?? null,
        provider: "stripe",
      };
    } catch (err) {
      const mapped = mapStripeError(err, "refundOrder");
      logger.error("Stripe refundOrder failed", {
        operation,
        provider: "stripe",
        meta: mapped.toLogObject(),
      });
      throw mapped;
    }
  }
}

function createStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new PaymentError({
      code: "payment_provider_config_error",
      message: "STRIPE_SECRET_KEY is not configured",
      userMessage:
        "Payment service is not configured. Please contact support.",
      statusCode: 503,
      provider: "stripe",
    });
  }

  // Prefer sandbox/test keys in non-production environments
  const nodeEnv = process.env.NODE_ENV ?? "development";
  if (nodeEnv !== "production" && !secretKey.startsWith("sk_test_")) {
    logger.warn(
      "STRIPE_SECRET_KEY does not look like a Stripe test/sandbox key",
      {
        operation: "stripe.client",
        provider: "stripe",
        meta: { nodeEnv },
      },
    );
  }

  return new Stripe(secretKey, {
    // Pin to the SDK's bundled API version for type safety
    apiVersion: "2026-07-29.dahlia",
    typescript: true,
    appInfo: {
      name: "Ecommerce App New",
      version: process.env.APP_VERSION ?? "0.0.0",
    },
  });
}

function validateEmail(email: string): void {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new PaymentError({
      code: "invalid_payment_request",
      message: "createCustomer requires a valid email",
      userMessage: "A valid email is required to create a payment profile.",
      statusCode: 400,
      provider: "stripe",
    });
  }
}

function validateChargeInput(input: ChargeOrderInput): void {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new PaymentError({
      code: "invalid_payment_request",
      message: "chargeOrder amount must be a positive integer (cents)",
      userMessage: "Order amount is invalid.",
      statusCode: 400,
      provider: "stripe",
    });
  }
  if (!input.currency || input.currency.length < 3) {
    throw new PaymentError({
      code: "invalid_payment_request",
      message: "chargeOrder requires an ISO currency code",
      userMessage: "Order currency is invalid.",
      statusCode: 400,
      provider: "stripe",
    });
  }
  if (!input.customerToken || !input.customerToken.startsWith("cus_")) {
    throw new PaymentError({
      code: "invalid_payment_request",
      message: "chargeOrder requires a Stripe customer token",
      userMessage: "Payment profile is missing or invalid.",
      statusCode: 400,
      provider: "stripe",
    });
  }
  if (!input.paymentMethodId || !input.paymentMethodId.startsWith("pm_")) {
    throw new PaymentError({
      code: "invalid_payment_request",
      message: "chargeOrder requires a Stripe payment method id",
      userMessage: "A valid payment method is required.",
      statusCode: 400,
      provider: "stripe",
    });
  }
}

/** Lazy singleton for app wiring — constructed on first use. */
let defaultAdapter: StripeAdapter | null = null;

export function getStripeAdapter(): StripeAdapter {
  if (!defaultAdapter) {
    defaultAdapter = new StripeAdapter();
  }
  return defaultAdapter;
}
