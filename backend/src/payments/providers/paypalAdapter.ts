/**
 * PayPal payment provider adapter using the official Server SDK.
 * Creates customers (vault token binding), charges via Orders create+capture,
 * and refunds captured payments. Returns opaque order IDs only — never PAN/CVV.
 */

import {
  CheckoutPaymentIntent,
  OrderStatus,
  RefundStatus,
  type Order,
  type OrdersController,
  type PaymentsController,
} from "@paypal/paypal-server-sdk";
import { PaymentError } from "../errors";
import {
  ConsolePaymentLogger,
  type PaymentLogger,
} from "../logger";
import { mapPayPalError } from "./mapPayPalError";
import {
  createPayPalControllers,
  type PayPalSdkControllers,
} from "./paypalClient";
import type {
  PaymentProvider,
  ProviderChargeRequest,
  ProviderChargeResponse,
  ProviderCreateCustomerRequest,
  ProviderCreateCustomerResponse,
  ProviderRefundRequest,
  ProviderRefundResponse,
} from "./types";

export interface PayPalAdapterOptions {
  /** Injected SDK controllers (tests). Defaults to sandbox client from env. */
  controllers?: PayPalSdkControllers;
  logger?: PaymentLogger;
}

export class PayPalAdapter implements PaymentProvider {
  readonly name = "paypal" as const;
  private readonly logger: PaymentLogger;
  private readonly injected?: PayPalSdkControllers;

  constructor(options: PayPalAdapterOptions = {}) {
    this.injected = options.controllers;
    this.logger = options.logger ?? new ConsolePaymentLogger();
  }

  private controllers(): PayPalSdkControllers {
    return this.injected ?? createPayPalControllers();
  }

  private orders(): OrdersController {
    return this.controllers().orders;
  }

  private payments(): PaymentsController {
    return this.controllers().payments;
  }

  /**
   * Binds a PayPal vault / payment-method token to a local customer reference.
   * PayPal does not expose a Stripe-style Customer resource for all flows;
   * we persist a stable provider customer id for the core service.
   */
  async createCustomer(
    request: ProviderCreateCustomerRequest,
  ): Promise<ProviderCreateCustomerResponse> {
    const action = "paypal.createCustomer";

    try {
      this.assertTokenized(request.paymentMethodToken);
      this.assertValidEmail(request.email);

      // Stable opaque id — vault token remains the charge instrument.
      const providerCustomerId = `PAYPAL-CUS-${randomCustomerSuffix()}`;

      this.logger.log({
        level: "info",
        action,
        result: "success",
        provider: "paypal",
        message: "PayPal customer reference created",
      });

      return {
        providerCustomerId,
        paymentMethodToken: request.paymentMethodToken,
      };
    } catch (err) {
      if (err instanceof PaymentError) {
        this.logger.log({
          level: "error",
          action,
          result: "failure",
          provider: "paypal",
          errorCode: err.code,
          message: err.message,
        });
        throw err;
      }
      throw mapPayPalError(err, action, this.logger);
    }
  }

  async charge(request: ProviderChargeRequest): Promise<ProviderChargeResponse> {
    return this.chargeOrder(request);
  }

  /**
   * Story entry-point for order charging:
   * 1) Create a PayPal order with amount + currency
   * 2) Capture the order
   * 3) Return the PayPal order ID for the core service to encrypt & store
   */
  async chargeOrder(
    request: ProviderChargeRequest,
  ): Promise<ProviderChargeResponse> {
    const action = "paypal.chargeOrder";

    try {
      this.assertTokenized(request.paymentMethodToken);
      this.assertValidCharge(request);

      const value = centsToPayPalAmount(request.amountCents);
      const currencyCode = request.currency.toUpperCase();

      const { result: created } = await this.orders().createOrder({
        body: {
          intent: CheckoutPaymentIntent.Capture,
          purchaseUnits: [
            {
              referenceId: request.orderId,
              description: request.description,
              customId: request.orderId,
              amount: {
                currencyCode,
                value,
              },
            },
          ],
          paymentSource: {
            // Vaulted PayPal Wallet / payment-method token from client SDK.
            paypal: {
              vaultId: request.paymentMethodToken,
            },
          },
        },
        paypalRequestId: request.idempotencyKey
          ? `${request.idempotencyKey}:create`
          : undefined,
        prefer: "return=representation",
      });

      if (!created.id) {
        throw new PaymentError(
          "provider_error",
          "PayPal did not return an order id",
        );
      }

      const settled = await this.ensureCaptured(
        created,
        request.idempotencyKey,
      );

      const status = this.mapOrderStatus(settled.status);
      if (status === "failed") {
        throw new PaymentError(
          "payment_required",
          "Payment could not be completed. Please try a different payment method.",
          { providerCode: settled.status ?? "FAILED" },
        );
      }

      this.logger.log({
        level: "info",
        action,
        result: "success",
        provider: "paypal",
        orderId: request.orderId,
        message: "PayPal order created and captured",
      });

      // Map PayPal order ID → opaque provider charge token for core encryption.
      return {
        providerChargeId: settled.id ?? created.id,
        status,
      };
    } catch (err) {
      if (err instanceof PaymentError) {
        this.logger.log({
          level: "error",
          action,
          result: "failure",
          provider: "paypal",
          orderId: request.orderId,
          errorCode: err.code,
          message: err.message,
        });
        throw err;
      }
      throw mapPayPalError(err, action, this.logger);
    }
  }

  /**
   * Refunds a previously captured PayPal order (full or partial).
   * Resolves the capture id from the order when needed.
   */
  async refund(request: ProviderRefundRequest): Promise<ProviderRefundResponse> {
    const action = "paypal.refund";

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
          "A valid PayPal order token is required to refund.",
        );
      }

      const captureId = await this.resolveCaptureId(request.providerChargeId);
      const currencyCode = (request.currency ?? "USD").toUpperCase();
      const { result: refund } = await this.payments().refundCapturedPayment({
        captureId,
        paypalRequestId: request.idempotencyKey,
        body: {
          amount: {
            currencyCode,
            value: centsToPayPalAmount(request.amountCents),
          },
        },
        prefer: "return=minimal",
      });

      if (!refund.id) {
        throw new PaymentError(
          "provider_error",
          "PayPal did not return a refund id",
        );
      }

      this.logger.log({
        level: "info",
        action,
        result: "success",
        provider: "paypal",
        message: "PayPal refund created",
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
          provider: "paypal",
          errorCode: err.code,
          message: err.message,
        });
        throw err;
      }
      throw mapPayPalError(err, action, this.logger);
    }
  }

  /**
   * Captures the order when create left it in APPROVED / CREATED state.
   * Vaulted payment_source create calls often complete in one step.
   */
  private async ensureCaptured(
    order: Order,
    idempotencyKey?: string,
  ): Promise<Order> {
    if (order.status === OrderStatus.Completed) {
      return order;
    }

    if (
      order.status === OrderStatus.Approved ||
      order.status === OrderStatus.Created
    ) {
      if (!order.id) {
        throw new PaymentError(
          "provider_error",
          "PayPal order is missing an id for capture",
        );
      }

      const { result: captured } = await this.orders().captureOrder({
        id: order.id,
        paypalRequestId: idempotencyKey
          ? `${idempotencyKey}:capture`
          : undefined,
        prefer: "return=representation",
      });

      return captured;
    }

    return order;
  }

  private async resolveCaptureId(orderOrCaptureId: string): Promise<string> {
    try {
      const { result: order } = await this.orders().getOrder({
        id: orderOrCaptureId,
      });
      const captureId =
        order.purchaseUnits?.[0]?.payments?.captures?.[0]?.id ?? null;
      if (captureId) {
        return captureId;
      }
    } catch {
      // Fall through — treat the token as a capture id directly.
    }
    return orderOrCaptureId;
  }

  private mapOrderStatus(
    status: OrderStatus | string | undefined,
  ): ProviderChargeResponse["status"] {
    switch (status) {
      case OrderStatus.Completed:
      case "COMPLETED":
        return "succeeded";
      case OrderStatus.Approved:
      case OrderStatus.Created:
      case OrderStatus.Saved:
      case OrderStatus.PayerActionRequired:
      case "APPROVED":
      case "CREATED":
      case "SAVED":
      case "PAYER_ACTION_REQUIRED":
        return "pending";
      case OrderStatus.Voided:
      case "VOIDED":
        return "failed";
      default:
        return "pending";
    }
  }

  private mapRefundStatus(
    status: RefundStatus | string | undefined,
  ): ProviderRefundResponse["status"] {
    switch (status) {
      case RefundStatus.Completed:
      case "COMPLETED":
        return "succeeded";
      case RefundStatus.Pending:
      case "PENDING":
        return "pending";
      case RefundStatus.Cancelled:
      case RefundStatus.Failed:
      case "CANCELLED":
      case "FAILED":
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
}

/** Formats minor units (cents) as a PayPal amount string with 2 decimal places. */
export function centsToPayPalAmount(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

function randomCustomerSuffix(): string {
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}
