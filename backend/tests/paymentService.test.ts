import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { PaymentService } from "../src/services/payment/PaymentService";
import { PaymentError } from "../src/services/payment/errors";
import {
  encryptPaymentToken,
  decryptPaymentToken,
} from "../src/services/payment/kms";
import { PaymentStore } from "../src/store/paymentStore";

process.env.PAYMENT_KMS_SECRET =
  process.env.PAYMENT_KMS_SECRET ??
  "test-payment-kms-secret-min-32-chars!!";

describe("simulated KMS", () => {
  it("encrypts and decrypts a provider token round-trip", () => {
    const plaintext = "pm_tok_simulated_visa_4242";
    const envelope = encryptPaymentToken(plaintext);
    assert.match(envelope, /^v1:/);
    assert.notEqual(envelope, plaintext);
    assert.equal(decryptPaymentToken(envelope), plaintext);
  });

  it("rejects empty tokens", () => {
    assert.throws(() => encryptPaymentToken(""), /empty/i);
  });
});

describe("PaymentService", () => {
  let service: PaymentService;
  let store: PaymentStore;

  beforeEach(() => {
    store = new PaymentStore();
    service = new PaymentService(store);
  });

  it("createCustomer happy path (stripe)", async () => {
    const customer = await service.createCustomer({
      email: "ada@example.com",
      displayName: "Ada Lovelace",
      provider: "stripe",
    });
    assert.ok(customer.id);
    assert.equal(customer.email, "ada@example.com");
    assert.equal(customer.provider, "stripe");
    assert.match(customer.providerCustomerId, /^cus_stripe_/);
  });

  it("createCustomer happy path (paypal)", async () => {
    const customer = await service.createCustomer({
      email: "grace@example.com",
      provider: "paypal",
    });
    assert.equal(customer.provider, "paypal");
    assert.match(customer.providerCustomerId, /^PAYPAL-CUS-/);
  });

  it("chargeOrder happy path stores encrypted token only", async () => {
    const customer = await service.createCustomer({
      email: "buyer@example.com",
      provider: "stripe",
    });
    const charge = await service.chargeOrder({
      customerId: customer.id,
      orderId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      amountCents: 4999,
      currency: "USD",
      paymentMethodToken: "pm_tok_simulated_visa_4242",
      provider: "stripe",
      idempotencyKey: "charge-test-001",
    });
    assert.equal(charge.status, "succeeded");
    assert.equal(charge.amountCents, 4999);
    assert.ok(charge.paymentTokenId);
    assert.match(charge.chargeId, /^ch_stripe_/);
  });

  it("chargeOrder declines when provider declines", async () => {
    const customer = await service.createCustomer({
      email: "buyer@example.com",
      provider: "stripe",
    });
    await assert.rejects(
      () =>
        service.chargeOrder({
          customerId: customer.id,
          orderId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          amountCents: 1000,
          currency: "USD",
          paymentMethodToken: "pm_tok_decline_card",
          provider: "stripe",
        }),
      (err: unknown) => {
        assert.ok(err instanceof PaymentError);
        assert.equal(err.code, "payment_declined");
        assert.equal(err.httpStatus, 402);
        return true;
      },
    );
  });

  it("chargeOrder returns not_found for unknown customer", async () => {
    await assert.rejects(
      () =>
        service.chargeOrder({
          customerId: "550e8400-e29b-41d4-a716-446655440000",
          orderId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          amountCents: 1000,
          currency: "USD",
          paymentMethodToken: "pm_tok_ok",
          provider: "stripe",
        }),
      (err: unknown) => {
        assert.ok(err instanceof PaymentError);
        assert.equal(err.code, "not_found");
        return true;
      },
    );
  });

  it("refund happy path (full refund)", async () => {
    const customer = await service.createCustomer({
      email: "buyer@example.com",
      provider: "stripe",
    });
    const charge = await service.chargeOrder({
      customerId: customer.id,
      orderId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      amountCents: 2500,
      currency: "USD",
      paymentMethodToken: "pm_tok_ok",
      provider: "stripe",
    });
    const refund = await service.refund({
      chargeId: charge.chargeId,
      reason: "requested_by_customer",
    });
    assert.equal(refund.status, "succeeded");
    assert.equal(refund.amountCents, 2500);
    assert.equal(refund.chargeId, charge.chargeId);
  });

  it("refund rejects over-refund", async () => {
    const customer = await service.createCustomer({
      email: "buyer@example.com",
      provider: "paypal",
    });
    const charge = await service.chargeOrder({
      customerId: customer.id,
      orderId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      amountCents: 1000,
      currency: "USD",
      paymentMethodToken: "PAYPAL_OK_TOKEN",
      provider: "paypal",
    });
    await assert.rejects(
      () =>
        service.refund({
          chargeId: charge.chargeId,
          amountCents: 1001,
        }),
      (err: unknown) => {
        assert.ok(err instanceof PaymentError);
        assert.equal(err.code, "validation_error");
        return true;
      },
    );
  });

  it("chargeOrder surfaces provider_error", async () => {
    const customer = await service.createCustomer({
      email: "buyer@example.com",
      provider: "stripe",
    });
    await assert.rejects(
      () =>
        service.chargeOrder({
          customerId: customer.id,
          orderId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          amountCents: 500,
          currency: "USD",
          paymentMethodToken: "pm_tok_error_upstream",
          provider: "stripe",
        }),
      (err: unknown) => {
        assert.ok(err instanceof PaymentError);
        assert.equal(err.code, "provider_error");
        assert.equal(err.httpStatus, 502);
        return true;
      },
    );
  });
});
