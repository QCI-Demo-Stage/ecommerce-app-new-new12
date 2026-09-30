import { logger } from "../utils/logger";
import type { PaymentProvider } from "./PaymentProvider";
import type { PaymentTokenStore } from "./tokenStore";
import { PaymentError } from "./errors";
import type {
  ChargeOrderInput,
  ChargeOrderResult,
  CreateCustomerInput,
  CreateCustomerResult,
  RefundOrderInput,
  RefundOrderResult,
} from "./types";

/**
 * Core payment service — orchestrates provider adapters and token persistence.
 * Callers should use this class rather than adapters directly.
 */
export class PaymentService {
  constructor(
    private readonly provider: PaymentProvider,
    private readonly tokens: PaymentTokenStore,
  ) {}

  get providerName(): string {
    return this.provider.name;
  }

  async createCustomer(
    input: CreateCustomerInput,
  ): Promise<CreateCustomerResult> {
    this.assertEmail(input.email);
    this.assertNonEmpty(input.userId, "userId");

    logger.info("payment.createCustomer.start", {
      action: "payment.createCustomer",
      provider: this.provider.name,
      userId: input.userId,
    });

    const result = await this.provider.createCustomer(input);

    await this.tokens.save({
      token: result.customerToken,
      kind: "customer",
      provider: result.provider,
      userId: input.userId,
      metadata: { emailDomain: input.email.split("@")[1] ?? "" },
    });

    logger.info("payment.createCustomer.success", {
      action: "payment.createCustomer",
      provider: this.provider.name,
      userId: input.userId,
    });

    return result;
  }

  async chargeOrder(input: ChargeOrderInput): Promise<ChargeOrderResult> {
    this.assertPositiveAmount(input.amount);
    this.assertCurrency(input.currency);
    this.assertNonEmpty(input.customerToken, "customerToken");
    this.assertNonEmpty(input.paymentMethodToken, "paymentMethodToken");
    this.assertNonEmpty(input.orderId, "orderId");

    logger.info("payment.chargeOrder.start", {
      action: "payment.chargeOrder",
      provider: this.provider.name,
      orderId: input.orderId,
      userId: input.userId,
      amount: input.amount,
      currency: input.currency.toLowerCase(),
    });

    const result = await this.provider.chargeOrder(input);

    await this.tokens.save({
      token: result.paymentToken,
      kind: "payment",
      provider: result.provider,
      userId: input.userId,
      orderId: input.orderId,
      metadata: {
        status: result.status,
        amount: String(result.amount),
        currency: result.currency,
      },
    });

    logger.info("payment.chargeOrder.success", {
      action: "payment.chargeOrder",
      provider: this.provider.name,
      orderId: input.orderId,
      status: result.status,
    });

    return result;
  }

  async refundOrder(input: RefundOrderInput): Promise<RefundOrderResult> {
    this.assertNonEmpty(input.paymentToken, "paymentToken");
    this.assertNonEmpty(input.orderId, "orderId");
    if (input.amount !== undefined) {
      this.assertPositiveAmount(input.amount);
    }

    logger.info("payment.refundOrder.start", {
      action: "payment.refundOrder",
      provider: this.provider.name,
      orderId: input.orderId,
      userId: input.userId,
    });

    const result = await this.provider.refundOrder(input);

    await this.tokens.save({
      token: result.refundToken,
      kind: "refund",
      provider: result.provider,
      userId: input.userId,
      orderId: input.orderId,
      metadata: {
        status: result.status,
        amount: result.amount !== null ? String(result.amount) : "",
      },
    });

    logger.info("payment.refundOrder.success", {
      action: "payment.refundOrder",
      provider: this.provider.name,
      orderId: input.orderId,
      status: result.status,
    });

    return result;
  }

  private assertEmail(email: string): void {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new PaymentError({
        code: "invalid_request",
        userMessage: "A valid email address is required",
        httpStatus: 400,
        provider: this.provider.name,
      });
    }
  }

  private assertNonEmpty(value: string, field: string): void {
    if (!value || value.trim().length === 0) {
      throw new PaymentError({
        code: "invalid_request",
        userMessage: `${field} is required`,
        httpStatus: 400,
        provider: this.provider.name,
      });
    }
  }

  private assertPositiveAmount(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new PaymentError({
        code: "invalid_request",
        userMessage: "Amount must be a positive integer in the smallest currency unit",
        httpStatus: 400,
        provider: this.provider.name,
      });
    }
  }

  private assertCurrency(currency: string): void {
    if (!currency || !/^[a-zA-Z]{3}$/.test(currency)) {
      throw new PaymentError({
        code: "invalid_request",
        userMessage: "Currency must be a 3-letter ISO code",
        httpStatus: 400,
        provider: this.provider.name,
      });
    }
  }
}
