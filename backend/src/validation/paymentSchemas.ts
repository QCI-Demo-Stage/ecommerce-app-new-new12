import { z } from "zod";

export const paymentProviderSchema = z.enum(["stripe", "paypal"]);

export const createCustomerSchema = z
  .object({
    email: z.string().email().max(255),
    name: z.string().min(1).max(200).optional(),
    provider: paymentProviderSchema,
    paymentMethodToken: z.string().min(8).max(256),
    metadata: z.record(z.string()).optional(),
  })
  .strict();

export const chargeOrderSchema = z
  .object({
    customerId: z.string().uuid(),
    orderId: z.string().uuid(),
    amountCents: z.number().int().min(1),
    currency: z.string().regex(/^[A-Z]{3}$/),
    idempotencyKey: z.string().min(8).max(128).optional(),
    description: z.string().max(500).optional(),
  })
  .strict();

export const refundSchema = z
  .object({
    chargeId: z.string().min(1).max(128),
    amountCents: z.number().int().min(1).optional(),
    reason: z
      .enum([
        "requested_by_customer",
        "duplicate",
        "fraudulent",
        "order_change",
        "other",
      ])
      .optional(),
    idempotencyKey: z.string().min(8).max(128).optional(),
  })
  .strict();

export type CreateCustomerBody = z.infer<typeof createCustomerSchema>;
export type ChargeOrderBody = z.infer<typeof chargeOrderSchema>;
export type RefundBody = z.infer<typeof refundSchema>;
