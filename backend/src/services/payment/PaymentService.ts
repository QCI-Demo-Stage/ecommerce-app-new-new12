import { PaymentError } from "./errors";
import { encryptPaymentToken } from "./kms";
import type { PaymentProvider } from "./providers/PaymentProvider";
import { StripeProvider } from "./providers/StripeProvider";
import { PayPalProvider } from "./providers/PayPalProvider";
import type {
  ChargeOrderInput,
  ChargeOrderResult,
  CreateCustomerInput,
  CreateCustomerResult,
  PaymentProviderName,
  RefundInput,
  RefundResult,
} from "./types";
import {
  paymentStore,
  type PaymentStore,
} from "../../store/paymentStore";

function logAction(
  action: string,
  details: Record<string, string | number | undefined>,
): void {
  // Structured audit log — never includes PAN, CVV, or plaintext tokens.
  const safe = { ...details };
  // eslint-disable-next-line no-console
  console.info(
    JSON.stringify({
      ts: new Date().toISOString(),
      component: "PaymentService",
      action,
      ...safe,
    }),
  );
}

export class PaymentService {
  private readonly providers: Map<PaymentProviderName, PaymentProvider>;
  private readonly store: PaymentStore;

  constructor(
    store: PaymentStore = paymentStore,
    providers?: Map<PaymentProviderName, PaymentProvider>,
  ) {
    this.store = store;
    this.providers =
      providers ??
      new Map<PaymentProviderName, PaymentProvider>([
        ["stripe", new StripeProvider()],
        ["paypal", new PayPalProvider()],
      ]);
  }

  private resolveProvider(name: PaymentProviderName): PaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new PaymentError(
        "validation_error",
        `Unsupported payment provider: ${name}`,
        400,
      );
    }
    return provider;
  }

  async createCustomer(
    input: CreateCustomerInput,
  ): Promise<CreateCustomerResult> {
    const provider = this.resolveProvider(input.provider);
    logAction("createCustomer.start", {
      provider: input.provider,
      emailDomain: input.email.split("@")[1] ?? "unknown",
    });

    try {
      const remote = await provider.createCustomer(input);
      const customer = await this.store.createCustomer({
        email: input.email,
        displayName: input.displayName ?? null,
        provider: input.provider,
        providerCustomerId: remote.providerCustomerId,
      });

      const result: CreateCustomerResult = {
        id: customer.id,
        email: customer.email,
        displayName: customer.displayName,
        provider: customer.provider,
        providerCustomerId: customer.providerCustomerId,
        createdAt: customer.createdAt.toISOString(),
      };

      logAction("createCustomer.success", {
        provider: input.provider,
        customerId: customer.id,
      });
      return result;
    } catch (err) {
      if (err instanceof PaymentError) {
        logAction("createCustomer.error", {
          provider: input.provider,
          code: err.code,
        });
        throw err;
      }
      logAction("createCustomer.error", {
        provider: input.provider,
        code: "internal_error",
      });
      throw new PaymentError(
        "internal_error",
        "Failed to create payment customer",
        500,
      );
    }
  }

  async chargeOrder(input: ChargeOrderInput): Promise<ChargeOrderResult> {
    if (input.amountCents < 1) {
      throw new PaymentError(
        "validation_error",
        "amountCents must be at least 1",
        400,
      );
    }
    if (!/^[A-Z]{3}$/.test(input.currency)) {
      throw new PaymentError(
        "validation_error",
        "currency must be a 3-letter ISO code",
        400,
      );
    }

    if (input.idempotencyKey) {
      const cached = this.store.getIdempotentResult(
        `charge:${input.idempotencyKey}`,
      );
      if (cached) {
        return JSON.parse(cached) as ChargeOrderResult;
      }
    }

    const customer = await this.store.findCustomer(input.customerId);
    if (!customer) {
      throw new PaymentError("not_found", "Customer not found", 404);
    }
    if (customer.provider !== input.provider) {
      throw new PaymentError(
        "validation_error",
        "Provider does not match customer provider",
        400,
      );
    }

    const provider = this.resolveProvider(input.provider);
    logAction("chargeOrder.start", {
      provider: input.provider,
      customerId: input.customerId,
      orderId: input.orderId,
      amountCents: input.amountCents,
    });

    try {
      const remote = await provider.charge(input);
      const encrypted = encryptPaymentToken(input.paymentMethodToken);
      const tokenRow = await this.store.saveEncryptedToken({
        customerId: input.customerId,
        tokenEncrypted: encrypted,
      });

      const result: ChargeOrderResult = {
        chargeId: remote.chargeId,
        customerId: input.customerId,
        orderId: input.orderId,
        amountCents: remote.amountCents,
        currency: remote.currency,
        status: remote.status,
        provider: input.provider,
        paymentTokenId: tokenRow.id,
        createdAt: new Date().toISOString(),
      };

      await this.store.saveCharge({
        chargeId: result.chargeId,
        customerId: result.customerId,
        orderId: result.orderId,
        amountCents: result.amountCents,
        currency: result.currency,
        provider: result.provider,
        paymentTokenId: result.paymentTokenId,
        status: result.status,
        refundedCents: 0,
        createdAt: new Date(result.createdAt),
      });

      if (input.idempotencyKey) {
        this.store.setIdempotentResult(
          `charge:${input.idempotencyKey}`,
          JSON.stringify(result),
        );
      }

      logAction("chargeOrder.success", {
        provider: input.provider,
        chargeId: result.chargeId,
        paymentTokenId: result.paymentTokenId,
      });
      return result;
    } catch (err) {
      if (err instanceof PaymentError) {
        logAction("chargeOrder.error", {
          provider: input.provider,
          code: err.code,
          orderId: input.orderId,
        });
        throw err;
      }
      logAction("chargeOrder.error", {
        provider: input.provider,
        code: "internal_error",
        orderId: input.orderId,
      });
      throw new PaymentError("internal_error", "Failed to charge order", 500);
    }
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    if (input.idempotencyKey) {
      const cached = this.store.getIdempotentResult(
        `refund:${input.idempotencyKey}`,
      );
      if (cached) {
        return JSON.parse(cached) as RefundResult;
      }
    }

    const charge = await this.store.findCharge(input.chargeId);
    if (!charge) {
      throw new PaymentError("not_found", "Charge not found", 404);
    }

    const remaining = charge.amountCents - charge.refundedCents;
    const amount = input.amountCents ?? remaining;
    if (amount < 1 || amount > remaining) {
      throw new PaymentError(
        "validation_error",
        "Refund amount exceeds remaining refundable balance",
        400,
      );
    }

    const providerName = input.provider ?? charge.provider;
    const provider = this.resolveProvider(providerName);

    logAction("refund.start", {
      provider: providerName,
      chargeId: input.chargeId,
      amountCents: amount,
    });

    try {
      const remote = await provider.refund({
        ...input,
        amountCents: amount,
        currency: charge.currency,
      });

      await this.store.updateChargeRefunded(
        charge.chargeId,
        charge.refundedCents + amount,
      );

      const result: RefundResult = {
        refundId: remote.refundId,
        chargeId: remote.chargeId,
        amountCents: remote.amountCents,
        currency: remote.currency,
        status: remote.status,
        provider: providerName,
        reason: input.reason ?? null,
        createdAt: new Date().toISOString(),
      };

      if (input.idempotencyKey) {
        this.store.setIdempotentResult(
          `refund:${input.idempotencyKey}`,
          JSON.stringify(result),
        );
      }

      logAction("refund.success", {
        provider: providerName,
        refundId: result.refundId,
        chargeId: result.chargeId,
      });
      return result;
    } catch (err) {
      if (err instanceof PaymentError) {
        logAction("refund.error", {
          provider: providerName,
          code: err.code,
          chargeId: input.chargeId,
        });
        throw err;
      }
      logAction("refund.error", {
        provider: providerName,
        code: "internal_error",
        chargeId: input.chargeId,
      });
      throw new PaymentError("internal_error", "Failed to refund charge", 500);
    }
  }
}

export const paymentService = new PaymentService();
