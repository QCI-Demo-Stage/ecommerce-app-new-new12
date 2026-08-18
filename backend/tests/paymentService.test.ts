/**
 * Unit tests for PaymentService — happy paths and error handling.
 * Run: npm test
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PaymentError, PaymentService, SimulatedKmsClient } from "../src/payments";
import type { PaymentLogger } from "../src/payments/logger";

function silentLogger(): PaymentLogger {
  return { log: () => undefined };
}

function createService(): PaymentService {
  return new PaymentService({
    logger: silentLogger(),
    kms: new SimulatedKmsClient(
      Buffer.from("0123456789abcdef0123456789abcdef"), // 32 bytes
    ),
  });
}

describe("PaymentService.createCustomer", () => {
  it("creates a customer and encrypted payment token (Stripe)", async () => {
    const service = createService();
    const result = await service.createCustomer({
      email: "jane@example.com",
      name: "Jane Doe",
      provider: "stripe",
      paymentMethodToken: "pm_tok_stripe_abc12345",
    });

    assert.equal(result.provider, "stripe");
    assert.ok(result.customerId);
    assert.ok(result.providerCustomerId.startsWith("cus_stripe_"));
    assert.ok(result.paymentTokenId);
    assert.ok(result.createdAt);
  });

  it("creates a customer via PayPal adapter", async () => {
    const service = createService();
    const result = await service.createCustomer({
      email: "paypal.user@example.com",
      provider: "paypal",
      paymentMethodToken: "PAYPAL-VAULT-TOKEN-001",
    });
    assert.equal(result.provider, "paypal");
    assert.ok(result.providerCustomerId.startsWith("PAYPAL-CUS-"));
  });

  it("rejects duplicate email+provider", async () => {
    const service = createService();
    const input = {
      email: "dup@example.com",
      provider: "stripe" as const,
      paymentMethodToken: "pm_tok_stripe_dup00001",
    };
    await service.createCustomer(input);
    await assert.rejects(
      () => service.createCustomer(input),
      (err: unknown) => {
        assert.ok(err instanceof PaymentError);
        assert.equal(err.code, "conflict");
        assert.equal(err.httpStatus, 409);
        return true;
      },
    );
  });

  it("rejects raw PAN as paymentMethodToken", async () => {
    const service = createService();
    await assert.rejects(
      () =>
        service.createCustomer({
          email: "pan@example.com",
          provider: "stripe",
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

describe("PaymentService.chargeOrder", () => {
  it("charges a provisioned customer (happy path)", async () => {
    const service = createService();
    const customer = await service.createCustomer({
      email: "charge@example.com",
      provider: "stripe",
      paymentMethodToken: "pm_tok_stripe_charge01",
    });
    const orderId = randomUUID();
    const charge = await service.chargeOrder({
      customerId: customer.customerId,
      orderId,
      amountCents: 4999,
      currency: "USD",
      idempotencyKey: "idem-charge-001",
    });

    assert.equal(charge.status, "succeeded");
    assert.equal(charge.amountCents, 4999);
    assert.equal(charge.currency, "USD");
    assert.equal(charge.orderId, orderId);
    assert.equal(charge.customerId, customer.customerId);
    assert.ok(charge.providerChargeId.startsWith("ch_stripe_"));
  });

  it("replays charge when idempotency key matches", async () => {
    const service = createService();
    const customer = await service.createCustomer({
      email: "idem@example.com",
      provider: "stripe",
      paymentMethodToken: "pm_tok_stripe_idem0001",
    });
    const orderId = randomUUID();
    const first = await service.chargeOrder({
      customerId: customer.customerId,
      orderId,
      amountCents: 1000,
      currency: "USD",
      idempotencyKey: "idem-key-shared",
    });
    const second = await service.chargeOrder({
      customerId: customer.customerId,
      orderId,
      amountCents: 1000,
      currency: "USD",
      idempotencyKey: "idem-key-shared",
    });
    assert.equal(second.chargeId, first.chargeId);
  });

  it("returns not_found for unknown customer", async () => {
    const service = createService();
    await assert.rejects(
      () =>
        service.chargeOrder({
          customerId: randomUUID(),
          orderId: randomUUID(),
          amountCents: 100,
          currency: "USD",
        }),
      (err: unknown) => {
        assert.ok(err instanceof PaymentError);
        assert.equal(err.code, "not_found");
        return true;
      },
    );
  });

  it("maps provider decline to payment_required", async () => {
    const service = createService();
    const customer = await service.createCustomer({
      email: "decline@example.com",
      provider: "stripe",
      paymentMethodToken: "pm_tok_stripe_decline",
    });
    await assert.rejects(
      () =>
        service.chargeOrder({
          customerId: customer.customerId,
          orderId: randomUUID(),
          amountCents: 2500,
          currency: "USD",
        }),
      (err: unknown) => {
        assert.ok(err instanceof PaymentError);
        assert.equal(err.code, "payment_required");
        assert.equal(err.httpStatus, 402);
        assert.equal(err.providerCode, "card_declined");
        return true;
      },
    );
  });
});

describe("PaymentService.refund", () => {
  it("refunds a succeeded charge in full", async () => {
    const service = createService();
    const customer = await service.createCustomer({
      email: "refund@example.com",
      provider: "paypal",
      paymentMethodToken: "PAYPAL-VAULT-REFUND-01",
    });
    const charge = await service.chargeOrder({
      customerId: customer.customerId,
      orderId: randomUUID(),
      amountCents: 3000,
      currency: "USD",
    });
    const refund = await service.refund({
      chargeId: charge.chargeId,
      reason: "requested_by_customer",
    });
    assert.equal(refund.amountCents, 3000);
    assert.equal(refund.status, "succeeded");
    assert.equal(refund.chargeId, charge.chargeId);
    assert.equal(refund.provider, "paypal");
  });

  it("supports partial refunds and rejects over-refund", async () => {
    const service = createService();
    const customer = await service.createCustomer({
      email: "partial@example.com",
      provider: "stripe",
      paymentMethodToken: "pm_tok_stripe_partial1",
    });
    const charge = await service.chargeOrder({
      customerId: customer.customerId,
      orderId: randomUUID(),
      amountCents: 5000,
      currency: "USD",
    });
    const partial = await service.refund({
      chargeId: charge.chargeId,
      amountCents: 2000,
    });
    assert.equal(partial.amountCents, 2000);

    await assert.rejects(
      () =>
        service.refund({
          chargeId: charge.chargeId,
          amountCents: 4000,
        }),
      (err: unknown) => {
        assert.ok(err instanceof PaymentError);
        assert.equal(err.code, "unprocessable_entity");
        return true;
      },
    );
  });

  it("returns not_found for unknown charge", async () => {
    const service = createService();
    await assert.rejects(
      () => service.refund({ chargeId: "ch_does_not_exist" }),
      (err: unknown) => {
        assert.ok(err instanceof PaymentError);
        assert.equal(err.code, "not_found");
        return true;
      },
    );
  });

  it("rejects second full refund as conflict", async () => {
    const service = createService();
    const customer = await service.createCustomer({
      email: "fullrefund@example.com",
      provider: "stripe",
      paymentMethodToken: "pm_tok_stripe_fullref1",
    });
    const charge = await service.chargeOrder({
      customerId: customer.customerId,
      orderId: randomUUID(),
      amountCents: 1500,
      currency: "USD",
    });
    await service.refund({ chargeId: charge.chargeId });
    await assert.rejects(
      () => service.refund({ chargeId: charge.chargeId }),
      (err: unknown) => {
        assert.ok(err instanceof PaymentError);
        assert.equal(err.code, "conflict");
        return true;
      },
    );
  });
});

describe("SimulatedKmsClient", () => {
  it("round-trips encrypt/decrypt without exposing plaintext equality of ciphertext", async () => {
    const kms = new SimulatedKmsClient(
      Buffer.from("0123456789abcdef0123456789abcdef"),
    );
    const plaintext = "pm_tok_secret_value";
    const a = await kms.encrypt(plaintext);
    const b = await kms.encrypt(plaintext);
    assert.notEqual(a, b); // random IV => distinct ciphertext
    assert.equal(await kms.decrypt(a), plaintext);
    assert.equal(await kms.decrypt(b), plaintext);
  });
});
