import { logger } from "../../utils/logger";
import {
  paymentTokenStore,
  type PaymentTokenStore,
  type StoredPaymentToken,
} from "../../store/paymentTokenStore";
import type { PaymentProvider } from "./PaymentProvider";
import { StripeAdapter } from "./stripe/StripeAdapter";
import type {
  ChargeOrderInput,
  ChargeResult,
  CustomerInput,
  PaymentToken,
  RefundOrderInput,
  RefundResult,
} from "./types";

/**
 * Core payment service.
 * Delegates provider-specific work to adapters and persists opaque tokens only.
 */
export class PaymentService {
  constructor(
    private readonly provider: PaymentProvider,
    private readonly tokens: PaymentTokenStore = paymentTokenStore,
  ) {}

  async createCustomer(input: CustomerInput): Promise<StoredPaymentToken> {
    const token = await this.provider.createCustomer(input);
    const stored = await this.persistToken(token, "payment.persistCustomerToken");
    return stored;
  }

  async chargeOrder(input: ChargeOrderInput): Promise<ChargeResult & {
    storedPaymentToken: StoredPaymentToken;
  }> {
    const result = await this.provider.chargeOrder(input);
    const storedPaymentToken = await this.persistToken(
      result.paymentToken,
      "payment.persistPaymentToken",
    );
    return { ...result, storedPaymentToken };
  }

  async refundOrder(input: RefundOrderInput): Promise<RefundResult & {
    storedRefundToken: StoredPaymentToken;
  }> {
    const result = await this.provider.refundOrder(input);
    const storedRefundToken = await this.persistToken(
      result.refundToken,
      "payment.persistRefundToken",
    );
    return { ...result, storedRefundToken };
  }

  private async persistToken(
    token: PaymentToken,
    action: string,
  ): Promise<StoredPaymentToken> {
    // Persist opaque token fields only — never raw provider errors or card data.
    const safe: PaymentToken = {
      provider: token.provider,
      kind: token.kind,
      token: token.token,
      createdAt: token.createdAt,
      references: token.references
        ? {
            userId: token.references.userId,
            orderId: token.references.orderId,
            customerToken: token.references.customerToken,
            paymentToken: token.references.paymentToken,
          }
        : undefined,
    };

    const stored = await this.tokens.save(safe);

    logger.info("Payment token persisted", {
      action,
      provider: token.provider,
      userId: token.references?.userId,
      result: "success",
      meta: {
        tokenKind: token.kind,
        orderId: token.references?.orderId ?? null,
        storageId: stored.id,
      },
    });

    return stored;
  }
}

let defaultService: PaymentService | null = null;

/** Lazy singleton wired to Stripe (sandbox keys via STRIPE_SECRET_KEY). */
export function getPaymentService(): PaymentService {
  if (!defaultService) {
    defaultService = new PaymentService(new StripeAdapter());
  }
  return defaultService;
}

/** Test helper — replace the default provider wiring. */
export function setPaymentServiceForTests(service: PaymentService | null): void {
  defaultService = service;
}

export { StripeAdapter } from "./stripe/StripeAdapter";
export type { PaymentProvider } from "./PaymentProvider";
export * from "./types";
