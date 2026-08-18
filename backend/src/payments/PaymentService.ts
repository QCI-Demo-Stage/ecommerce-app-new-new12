/**
 * Core payment service abstraction.
 * Delegates to provider adapters (Stripe / PayPal), encrypts tokens via
 * simulated KMS, and never accepts or persists raw card data.
 */

import { randomUUID } from "node:crypto";
import { PaymentError } from "./errors";
import { SimulatedKmsClient, type KmsClient } from "./kms";
import {
  ConsolePaymentLogger,
  type PaymentLogger,
} from "./logger";
import { getProvider, type PaymentProvider } from "./providers";
import {
  InMemoryChargeStore,
  InMemoryCustomerStore,
  InMemoryPaymentTokenStore,
  type ChargeStore,
  type CustomerStore,
  type PaymentTokenStore,
} from "./stores";
import type {
  ChargeOrderInput,
  ChargeOrderResult,
  CreateCustomerInput,
  CreateCustomerResult,
  PaymentProviderName,
  RefundInput,
  RefundResult,
} from "./types";

export interface PaymentServiceDeps {
  customerStore?: CustomerStore;
  tokenStore?: PaymentTokenStore;
  chargeStore?: ChargeStore;
  kms?: KmsClient;
  logger?: PaymentLogger;
  providers?: Partial<Record<PaymentProviderName, PaymentProvider>>;
}

export class PaymentService {
  private readonly customers: CustomerStore;
  private readonly tokens: PaymentTokenStore;
  private readonly charges: ChargeStore;
  private readonly kms: KmsClient;
  private readonly logger: PaymentLogger;
  private readonly providers: Partial<Record<PaymentProviderName, PaymentProvider>>;

  constructor(deps: PaymentServiceDeps = {}) {
    this.customers = deps.customerStore ?? new InMemoryCustomerStore();
    this.tokens = deps.tokenStore ?? new InMemoryPaymentTokenStore();
    this.charges = deps.chargeStore ?? new InMemoryChargeStore();
    this.kms = deps.kms ?? new SimulatedKmsClient();
    this.logger = deps.logger ?? new ConsolePaymentLogger();
    this.providers = deps.providers ?? {};
  }

  async createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResult> {
    this.rejectRawCardData(input.paymentMethodToken);

    const existing = await this.customers.findByEmailAndProvider(
      input.email,
      input.provider,
    );
    if (existing) {
      this.logger.log({
        level: "warn",
        action: "createCustomer",
        result: "failure",
        customerId: existing.id,
        provider: input.provider,
        errorCode: "conflict",
        message: "Customer already exists for email and provider",
      });
      throw new PaymentError(
        "conflict",
        "Customer already exists for this email and provider",
      );
    }

    try {
      const provider = getProvider(input.provider, this.providers);
      const providerResult = await provider.createCustomer({
        email: input.email,
        name: input.name,
        paymentMethodToken: input.paymentMethodToken,
        metadata: input.metadata,
      });

      const customer = await this.customers.create({
        email: input.email,
        name: input.name ?? null,
        provider: input.provider,
        providerCustomerId: providerResult.providerCustomerId,
      });

      const tokenEncrypted = await this.kms.encrypt(
        providerResult.paymentMethodToken,
      );
      const token = await this.tokens.create({
        customerId: customer.id,
        tokenEncrypted,
      });

      this.logger.log({
        level: "info",
        action: "createCustomer",
        result: "success",
        customerId: customer.id,
        provider: input.provider,
      });

      return {
        customerId: customer.id,
        provider: customer.provider,
        providerCustomerId: customer.providerCustomerId,
        paymentTokenId: token.id,
        createdAt: customer.createdAt.toISOString(),
      };
    } catch (err) {
      if (err instanceof PaymentError) {
        this.logger.log({
          level: "error",
          action: "createCustomer",
          result: "failure",
          provider: input.provider,
          errorCode: err.code,
          message: err.message,
        });
        throw err;
      }
      this.logger.log({
        level: "error",
        action: "createCustomer",
        result: "failure",
        provider: input.provider,
        errorCode: "provider_error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
      throw new PaymentError("provider_error", "Payment provider unavailable", {
        cause: err,
      });
    }
  }

  async chargeOrder(input: ChargeOrderInput): Promise<ChargeOrderResult> {
    if (input.amountCents < 1) {
      throw new PaymentError("validation_error", "amountCents must be at least 1");
    }
    if (!/^[A-Z]{3}$/.test(input.currency)) {
      throw new PaymentError("validation_error", "currency must be ISO 4217");
    }

    if (input.idempotencyKey) {
      const prior = await this.charges.findByIdempotencyKey(input.idempotencyKey);
      if (prior) {
        this.logger.log({
          level: "info",
          action: "chargeOrder",
          result: "success",
          customerId: prior.customerId,
          chargeId: prior.id,
          orderId: prior.orderId,
          provider: prior.provider,
          message: "Idempotent replay",
        });
        return this.toChargeResult(prior);
      }
    }

    const customer = await this.customers.findById(input.customerId);
    if (!customer) {
      throw new PaymentError("not_found", "Customer not found");
    }

    const tokenRecord = await this.tokens.findByCustomerId(customer.id);
    if (!tokenRecord) {
      throw new PaymentError(
        "unprocessable_entity",
        "No payment token on file for customer",
      );
    }

    const paymentMethodToken = await this.kms.decrypt(tokenRecord.tokenEncrypted);

    try {
      const provider = getProvider(customer.provider, this.providers);
      const providerResult = await provider.charge({
        providerCustomerId: customer.providerCustomerId,
        paymentMethodToken,
        amountCents: input.amountCents,
        currency: input.currency,
        orderId: input.orderId,
        idempotencyKey: input.idempotencyKey,
        description: input.description,
      });

      const charge = await this.charges.create({
        id: `ch_${randomUUID().replace(/-/g, "")}`,
        customerId: customer.id,
        orderId: input.orderId,
        amountCents: input.amountCents,
        currency: input.currency,
        status: providerResult.status,
        provider: customer.provider,
        providerChargeId: providerResult.providerChargeId,
        refundedCents: 0,
        idempotencyKey: input.idempotencyKey ?? null,
      });

      this.logger.log({
        level: "info",
        action: "chargeOrder",
        result: "success",
        customerId: customer.id,
        chargeId: charge.id,
        orderId: input.orderId,
        provider: customer.provider,
      });

      return this.toChargeResult(charge);
    } catch (err) {
      if (err instanceof PaymentError) {
        this.logger.log({
          level: "error",
          action: "chargeOrder",
          result: "failure",
          customerId: customer.id,
          orderId: input.orderId,
          provider: customer.provider,
          errorCode: err.code,
          message: err.message,
        });
        throw err;
      }
      this.logger.log({
        level: "error",
        action: "chargeOrder",
        result: "failure",
        customerId: customer.id,
        orderId: input.orderId,
        provider: customer.provider,
        errorCode: "provider_error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
      throw new PaymentError("provider_error", "Payment provider unavailable", {
        cause: err,
      });
    }
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    const charge = await this.charges.findById(input.chargeId);
    if (!charge) {
      throw new PaymentError("not_found", "Charge not found");
    }
    if (charge.status !== "succeeded") {
      throw new PaymentError(
        "unprocessable_entity",
        "Only succeeded charges can be refunded",
      );
    }

    const remaining = charge.amountCents - charge.refundedCents;
    if (remaining <= 0) {
      throw new PaymentError("conflict", "Charge has already been fully refunded");
    }

    const amountCents = input.amountCents ?? remaining;
    if (amountCents < 1) {
      throw new PaymentError("validation_error", "amountCents must be at least 1");
    }
    if (amountCents > remaining) {
      throw new PaymentError(
        "unprocessable_entity",
        "Refund amount exceeds remaining refundable balance",
      );
    }

    try {
      const provider = getProvider(charge.provider, this.providers);
      const providerResult = await provider.refund({
        providerChargeId: charge.providerChargeId,
        amountCents,
        reason: input.reason,
        idempotencyKey: input.idempotencyKey,
      });

      await this.charges.updateRefundedCents(
        charge.id,
        charge.refundedCents + amountCents,
      );

      const refundId = `re_${randomUUID().replace(/-/g, "")}`;
      const createdAt = new Date().toISOString();

      this.logger.log({
        level: "info",
        action: "refund",
        result: "success",
        customerId: charge.customerId,
        chargeId: charge.id,
        provider: charge.provider,
      });

      return {
        refundId,
        chargeId: charge.id,
        amountCents,
        currency: charge.currency,
        status: providerResult.status,
        provider: charge.provider,
        providerRefundId: providerResult.providerRefundId,
        reason: input.reason ?? null,
        createdAt,
      };
    } catch (err) {
      if (err instanceof PaymentError) {
        this.logger.log({
          level: "error",
          action: "refund",
          result: "failure",
          customerId: charge.customerId,
          chargeId: charge.id,
          provider: charge.provider,
          errorCode: err.code,
          message: err.message,
        });
        throw err;
      }
      this.logger.log({
        level: "error",
        action: "refund",
        result: "failure",
        customerId: charge.customerId,
        chargeId: charge.id,
        provider: charge.provider,
        errorCode: "provider_error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
      throw new PaymentError("provider_error", "Payment provider unavailable", {
        cause: err,
      });
    }
  }

  private toChargeResult(charge: {
    id: string;
    customerId: string;
    orderId: string;
    amountCents: number;
    currency: string;
    status: ChargeOrderResult["status"];
    provider: PaymentProviderName;
    providerChargeId: string;
    createdAt: Date;
  }): ChargeOrderResult {
    return {
      chargeId: charge.id,
      customerId: charge.customerId,
      orderId: charge.orderId,
      amountCents: charge.amountCents,
      currency: charge.currency,
      status: charge.status,
      provider: charge.provider,
      providerChargeId: charge.providerChargeId,
      createdAt: charge.createdAt.toISOString(),
    };
  }

  private rejectRawCardData(token: string): void {
    const digits = token.replace(/[\s-]/g, "");
    if (/^\d{13,19}$/.test(digits)) {
      throw new PaymentError(
        "validation_error",
        "Raw card numbers are not accepted; use a provider payment method token",
        {
          details: [
            {
              path: "paymentMethodToken",
              message: "Must be a provider-issued token, not a PAN",
            },
          ],
        },
      );
    }
    // CVV-only payloads (3–4 digits) are also rejected when sent alone
    if (/^\d{3,4}$/.test(digits)) {
      throw new PaymentError(
        "validation_error",
        "CVV and other sensitive authentication data must not be sent",
        {
          details: [
            {
              path: "paymentMethodToken",
              message: "Sensitive auth data is not accepted",
            },
          ],
        },
      );
    }
  }
}
