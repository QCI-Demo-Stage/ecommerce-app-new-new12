/**
 * Unit tests for StripeAdapter — uses an injected mock Stripe client
 * so no live network calls or secret keys are required.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";
import { PaymentError } from "../src/payments/errors";
import type { PaymentLogger } from "../src/payments/logger";
import { StripeAdapter } from "../src/payments/providers/stripeAdapter";
import { mapStripeError, toStandardizedError } from "../src/payments/providers/mapStripeError";

function silentLogger(): PaymentLogger {
  return { log: () => undefined };
}

function createMockStripe(overrides: {
  customersCreate?: (...args: unknown[]) => Promise<unknown>;
  paymentIntentsCreate?: (...args: unknown[]) => Promise<unknown>;
  paymentIntentsConfirm?: (...args: unknown[]) => Promise<unknown>;
  refundsCreate?: (...args: unknown[]) => Promise<unknown>;
} = {}): Stripe {
  return {
    customers: {
      create:
        overrides.customersCreate ??
        (async () => ({
          id: "cus_test_123",
          created: Math.floor(Date.now() / 1000),
        })),
    },
    paymentIntents: {
      create:
        overrides.paymentIntentsCreate ??
        (async () => ({
          id: "pi_test_pending",
          status: "requires_confirmation",
          amount: 4999,
          currency: "usd",
          created: Math.floor(Date.now() / 1000),
        })),
      confirm:
        overrides.paymentIntentsConfirm ??
        (async () => ({
          id: "pi_test_succeeded",
          status: "succeeded",
          amount: 4999,
          currency: "usd",
          created: Math.floor(Date.now() / 1000),
        })),
    },
    refunds: {
      create:
        overrides.refundsCreate ??
        (async () => ({
          id: "re_test_123",
          status: "succeeded",
          amount: 1000,
          currency: "usd",
          created: Math.floor(Date.now() / 1000),
        })),
    },
  } as unknown as Stripe;
}

describe("StripeAdapter.createCustomer", () => {
  it("calls stripe.customers.create and returns customer.id token", async () => {
    let captured: unknown;
    const adapter = new StripeAdapter({
      stripe: createMockStripe({
        customersCreate: async (params: unknown) => {
          captured = params;
          return { id: "cus_live_abc", created: 1 };
        },
      }),
      logger: silentLogger(),
    });

    const result = await adapter.createCustomer({
      email: "buyer@example.com",
      name: "Buyer",
      paymentMethodToken: "pm_card_visa",
      metadata: { userId: "u-1" },
    });

    assert.equal(result.providerCustomerId, "cus_live_abc");
    assert.equal(result.paymentMethodToken, "pm_card_visa");
    assert.deepEqual(captured, {
      email: "buyer@example.com",
      name: "Buyer",
      payment_method: "pm_card_visa",
      invoice_settings: { default_payment_method: "pm_card_visa" },
      metadata: { userId: "u-1" },
    });
  });

  it("rejects raw PAN tokens", async () => {
    const adapter = new StripeAdapter({
      stripe: createMockStripe(),
      logger: silentLogger(),
    });
    await assert.rejects(
      () =>
        adapter.createCustomer({
          email: "x@example.com",
          paymentMethodToken: "4242424242424242",
        }),
      (err: unknown) => {
        assert.ok(err instanceof PaymentError);
        assert.equal(err.code, "validation_error");
        return true;
      },
    );
  });
});

describe("StripeAdapter.chargeOrder", () => {
  it("creates and confirms a payment intent, returning payment token", async () => {
    const created: unknown[] = [];
    const confirmed: unknown[] = [];
    const adapter = new StripeAdapter({
      stripe: createMockStripe({
        paymentIntentsCreate: async (params: unknown) => {
          created.push(params);
          return { id: "pi_created", status: "requires_confirmation" };
        },
        paymentIntentsConfirm: async (id: unknown, params: unknown) => {
          confirmed.push({ id, params });
          return {
            id: "pi_created",
            status: "succeeded",
            amount: 2500,
            currency: "usd",
          };
        },
      }),
      logger: silentLogger(),
    });

    const result = await adapter.chargeOrder({
      providerCustomerId: "cus_live_abc",
      paymentMethodToken: "pm_card_visa",
      amountCents: 2500,
      currency: "USD",
      orderId: "ord-1",
      idempotencyKey: "idem-1",
    });

    assert.equal(result.providerChargeId, "pi_created");
    assert.equal(result.status, "succeeded");
    assert.equal(created.length, 1);
    assert.equal(confirmed.length, 1);
  });

  it("charge delegates to chargeOrder", async () => {
    const adapter = new StripeAdapter({
      stripe: createMockStripe(),
      logger: silentLogger(),
    });
    const result = await adapter.charge({
      providerCustomerId: "cus_x",
      paymentMethodToken: "pm_x",
      amountCents: 100,
      currency: "USD",
      orderId: "ord-2",
    });
    assert.equal(result.status, "succeeded");
    assert.ok(result.providerChargeId.startsWith("pi_"));
  });
});

describe("StripeAdapter.refund", () => {
  it("creates a Stripe refund against the payment intent token", async () => {
    let captured: unknown;
    const adapter = new StripeAdapter({
      stripe: createMockStripe({
        refundsCreate: async (params: unknown) => {
          captured = params;
          return { id: "re_abc", status: "succeeded" };
        },
      }),
      logger: silentLogger(),
    });

    const result = await adapter.refund({
      providerChargeId: "pi_created",
      amountCents: 500,
      reason: "requested_by_customer",
    });

    assert.equal(result.providerRefundId, "re_abc");
    assert.equal(result.status, "succeeded");
    assert.deepEqual(captured, {
      payment_intent: "pi_created",
      amount: 500,
      reason: "requested_by_customer",
    });
  });
});

describe("mapStripeError", () => {
  it("maps card errors to user-friendly payment_required messages", () => {
    const Stripe = require("stripe") as typeof import("stripe");
    const cardErr = new Stripe.errors.StripeCardError({
      message: "Your card was declined. RAW PROVIDER DETAIL",
      type: "card_error",
      code: "card_declined",
      statusCode: 402,
    });
    const mapped = toStandardizedError(cardErr);
    assert.equal(mapped.code, "payment_required");
    assert.equal(
      mapped.message,
      "Your card was declined. Please try a different payment method.",
    );
    assert.equal(mapped.message.includes("RAW PROVIDER DETAIL"), false);
    assert.equal(mapped.providerCode, "card_declined");
  });

  it("never persists raw error objects on PaymentError", () => {
    const logs: unknown[] = [];
    const logger: PaymentLogger = {
      log: (entry) => {
        logs.push(entry);
      },
    };
    const err = mapStripeError(new Error("secret stack"), "stripe.test", logger);
    assert.ok(err instanceof PaymentError);
    assert.equal(err.message.includes("secret stack"), false);
    assert.equal(logs.length, 1);
    const entry = logs[0] as { message?: string };
    assert.equal(entry.message?.includes("secret stack"), false);
  });
});
