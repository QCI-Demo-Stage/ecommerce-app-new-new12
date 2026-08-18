import { logger } from "../utils/logger";
import { PaymentError } from "./errors";
import type { PaymentProvider } from "./PaymentProvider";
import { getStripeAdapter } from "./StripeAdapter";
import {
  paymentTokenStore,
  type PaymentTokenStore,
} from "./tokenStore";
import type {
  ChargeOrderInput,
  ChargeOrderResult,
  CreateCustomerInput,
  CreateCustomerResult,
  RefundOrderInput,
  RefundOrderResult,
  StoredPaymentToken,
} from "./types";

/**
 * Core payment service — provider-agnostic orchestration with token
 * persistence. Adapters (Stripe, …) perform provider I/O; this layer
 * stores only opaque tokens and safe metadata.
 */
export class PaymentService {
  constructor(
    private readonly provider: PaymentProvider = getStripeAdapter(),
    private readonly tokens: PaymentTokenStore = paymentTokenStore,
  ) {}

  async createCustomer(
    input: CreateCustomerInput,
  ): Promise<CreateCustomerResult & { stored: StoredPaymentToken }> {
    const result = await this.provider.createCustomer(input);

    const stored = await this.tokens.save({
      kind: "customer",
      provider: "stripe",
      providerToken: result.customerToken,
      userId: input.userId,
      status: "active",
    });

    logger.info("Persisted customer payment token", {
      operation: "payment.createCustomer",
      provider: result.provider,
      meta: { tokenId: stored.id, kind: stored.kind },
    });

    return { ...result, stored };
  }

  async chargeOrder(
    input: ChargeOrderInput & { userId?: string },
  ): Promise<ChargeOrderResult & { stored: StoredPaymentToken }> {
    const result = await this.provider.chargeOrder(input);

    const stored = await this.tokens.save({
      kind: "payment",
      provider: "stripe",
      providerToken: result.paymentToken,
      userId: input.userId,
      orderId: input.orderId,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
    });

    logger.info("Persisted payment token", {
      operation: "payment.chargeOrder",
      provider: result.provider,
      meta: {
        tokenId: stored.id,
        kind: stored.kind,
        status: result.status,
        amount: result.amount,
        currency: result.currency,
      },
    });

    return { ...result, stored };
  }

  async refundOrder(
    input: RefundOrderInput & { userId?: string; orderId?: string },
  ): Promise<RefundOrderResult & { stored: StoredPaymentToken }> {
    // Ensure we only refund tokens we previously persisted when possible
    const prior = await this.tokens.findByProviderToken(input.paymentToken);
    if (prior && prior.kind !== "payment") {
      throw new PaymentError({
        code: "invalid_payment_request",
        message: "refundOrder target is not a payment token",
        userMessage: "Invalid payment reference for refund.",
        statusCode: 400,
        provider: "stripe",
      });
    }

    const result = await this.provider.refundOrder(input);

    const stored = await this.tokens.save({
      kind: "refund",
      provider: "stripe",
      providerToken: result.refundToken,
      userId: input.userId ?? prior?.userId,
      orderId: input.orderId ?? prior?.orderId,
      amount: result.amount ?? undefined,
      currency: prior?.currency,
      status: result.status,
    });

    logger.info("Persisted refund token", {
      operation: "payment.refundOrder",
      provider: result.provider,
      meta: {
        tokenId: stored.id,
        kind: stored.kind,
        status: result.status,
      },
    });

    return { ...result, stored };
  }

  async getStoredToken(providerToken: string): Promise<StoredPaymentToken | null> {
    return this.tokens.findByProviderToken(providerToken);
  }
}

export const paymentService = new PaymentService();
