import { z } from "zod";

const providerSchema = z.enum(["stripe", "paypal"]);

export const createCustomerSchema = z.object({
  email: z.string().trim().email("Valid email is required").max(255),
  displayName: z.string().trim().max(255).optional(),
  provider: providerSchema,
  metadata: z.record(z.string()).optional(),
});

export const chargeOrderSchema = z.object({
  customerId: z.string().uuid("customerId must be a UUID"),
  orderId: z.string().uuid("orderId must be a UUID"),
  amountCents: z.number().int().min(1, "amountCents must be at least 1"),
  currency: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/, "currency must be a 3-letter ISO code"),
  paymentMethodToken: z.string().min(1).max(512),
  provider: providerSchema,
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export const refundSchema = z.object({
  chargeId: z.string().min(1).max(255),
  amountCents: z.number().int().min(1).optional(),
  reason: z
    .enum(["duplicate", "fraudulent", "requested_by_customer", "other"])
    .optional(),
  idempotencyKey: z.string().min(8).max(128).optional(),
  provider: providerSchema.optional(),
});

export type CreateCustomerBody = z.infer<typeof createCustomerSchema>;
export type ChargeOrderBody = z.infer<typeof chargeOrderSchema>;
export type RefundBody = z.infer<typeof refundSchema>;
