/**
 * Unit tests for PayPalAdapter.chargeOrder — uses injected mock controllers
 * so no live network calls or credentials are required.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { OrderStatus, RefundStatus } from "@paypal/paypal-server-sdk";
import { PaymentError } from "../src/payments/errors";
import type { PaymentLogger } from "../src/payments/logger";
import {
  centsToPayPalAmount,
  PayPalAdapter,
} from "../src/payments/providers/paypalAdapter";
import type { PayPalSdkControllers } from "../src/payments/providers/paypalClient";

function silentLogger(): PaymentLogger {
  return { log: () => undefined };
}

function createMockControllers(overrides: {
  createOrder?: (...args: unknown[]) => Promise<unknown>;
  captureOrder?: (...args: unknown[]) => Promise<unknown>;
  getOrder?: (...args: unknown[]) => Promise<unknown>;
  refundCapturedPayment?: (...args: unknown[]) => Promise<unknown>;
} = {}): PayPalSdkControllers {
  return {
    orders: {
      createOrder:
        overrides.createOrder ??
        (async () => ({
          result: {
            id: "5O190127TN364715T",
            status: OrderStatus.Completed,
          },
        })),
      captureOrder:
        overrides.captureOrder ??
        (async () => ({
          result: {
            id: "5O190127TN364715T",
            status: OrderStatus.Completed,
          },
        })),
      getOrder:
        overrides.getOrder ??
        (async () => ({
          result: {
            id: "5O190127TN364715T",
            status: OrderStatus.Completed,
            purchaseUnits: [
              {
                payments: {
                  captures: [{ id: "CAPTURE-ABC-001" }],
                },
              },
            ],
          },
        })),
    },
    payments: {
      refundCapturedPayment:
        overrides.refundCapturedPayment ??
        (async () => ({
          result: {
            id: "REFUND-XYZ-001",
            status: RefundStatus.Completed,
          },
        })),
    },
  } as unknown as PayPalSdkControllers;
}

describe("centsToPayPalAmount", () => {
  it("formats minor units as decimal strings", () => {
    assert.equal(centsToPayPalAmount(4999), "49.99");
    assert.equal(centsToPayPalAmount(100), "1.00");
    assert.equal(centsToPayPalAmount(1), "0.01");
  });
});

describe("PayPalAdapter.chargeOrder", () => {
  it("creates an order with amount/currency then returns the order id", async () => {
    let createBody: unknown;
    const adapter = new PayPalAdapter({
      controllers: createMockControllers({
        createOrder: async (params: unknown) => {
          createBody = (params as { body: unknown }).body;
          return {
            result: {
              id: "ORDER-CREATED-001",
              status: OrderStatus.Completed,
            },
          };
        },
      }),
      logger: silentLogger(),
    });

    const result = await adapter.chargeOrder({
      providerCustomerId: "PAYPAL-CUS-TEST",
      paymentMethodToken: "vault_tok_paypal_abc",
      amountCents: 4999,
      currency: "usd",
      orderId: "ord_internal_1",
      description: "Test order",
      idempotencyKey: "idem-1",
    });

    assert.equal(result.providerChargeId, "ORDER-CREATED-001");
    assert.equal(result.status, "succeeded");
    assert.deepEqual(createBody, {
      intent: "CAPTURE",
      purchaseUnits: [
        {
          referenceId: "ord_internal_1",
          description: "Test order",
          customId: "ord_internal_1",
          amount: {
            currencyCode: "USD",
            value: "49.99",
          },
        },
      ],
      paymentSource: {
        paypal: {
          vaultId: "vault_tok_paypal_abc",
        },
      },
    });
  });

  it("captures when create returns APPROVED", async () => {
    let capturedId: string | undefined;
    const adapter = new PayPalAdapter({
      controllers: createMockControllers({
        createOrder: async () => ({
          result: {
            id: "ORDER-APPROVED-001",
            status: OrderStatus.Approved,
          },
        }),
        captureOrder: async (params: unknown) => {
          capturedId = (params as { id: string }).id;
          return {
            result: {
              id: "ORDER-APPROVED-001",
              status: OrderStatus.Completed,
            },
          };
        },
      }),
      logger: silentLogger(),
    });

    const result = await adapter.chargeOrder({
      providerCustomerId: "PAYPAL-CUS-TEST",
      paymentMethodToken: "vault_tok_paypal_abc",
      amountCents: 2500,
      currency: "USD",
      orderId: "ord_2",
    });

    assert.equal(capturedId, "ORDER-APPROVED-001");
    assert.equal(result.providerChargeId, "ORDER-APPROVED-001");
    assert.equal(result.status, "succeeded");
  });

  it("rejects raw PAN tokens", async () => {
    const adapter = new PayPalAdapter({
      controllers: createMockControllers(),
      logger: silentLogger(),
    });
    await assert.rejects(
      () =>
        adapter.chargeOrder({
          providerCustomerId: "PAYPAL-CUS-TEST",
          paymentMethodToken: "4111111111111111",
          amountCents: 1000,
          currency: "USD",
          orderId: "ord_3",
        }),
      (err: unknown) => {
        assert.ok(err instanceof PaymentError);
        assert.equal(err.code, "validation_error");
        return true;
      },
    );
  });

  it("rejects non-positive amounts", async () => {
    const adapter = new PayPalAdapter({
      controllers: createMockControllers(),
      logger: silentLogger(),
    });
    await assert.rejects(
      () =>
        adapter.chargeOrder({
          providerCustomerId: "PAYPAL-CUS-TEST",
          paymentMethodToken: "vault_tok_ok",
          amountCents: 0,
          currency: "USD",
          orderId: "ord_4",
        }),
      (err: unknown) => {
        assert.ok(err instanceof PaymentError);
        assert.equal(err.code, "validation_error");
        return true;
      },
    );
  });
});

describe("PayPalAdapter.createCustomer", () => {
  it("returns an opaque PayPal customer reference", async () => {
    const adapter = new PayPalAdapter({
      controllers: createMockControllers(),
      logger: silentLogger(),
    });
    const result = await adapter.createCustomer({
      email: "buyer@example.com",
      paymentMethodToken: "vault_tok_paypal_abc",
    });
    assert.ok(result.providerCustomerId.startsWith("PAYPAL-CUS-"));
    assert.equal(result.paymentMethodToken, "vault_tok_paypal_abc");
  });
});

describe("PayPalAdapter.refund", () => {
  it("resolves capture id from order then refunds", async () => {
    let refundCaptureId: string | undefined;
    const adapter = new PayPalAdapter({
      controllers: createMockControllers({
        refundCapturedPayment: async (params: unknown) => {
          refundCaptureId = (params as { captureId: string }).captureId;
          return {
            result: { id: "REFUND-1", status: RefundStatus.Completed },
          };
        },
      }),
      logger: silentLogger(),
    });

    const result = await adapter.refund({
      providerChargeId: "5O190127TN364715T",
      amountCents: 1000,
      currency: "USD",
    });

    assert.equal(refundCaptureId, "CAPTURE-ABC-001");
    assert.equal(result.providerRefundId, "REFUND-1");
    assert.equal(result.status, "succeeded");
  });
});
