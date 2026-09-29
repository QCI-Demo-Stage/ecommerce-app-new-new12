import { z } from "zod";

export const createOrderItemSchema = z.object({
  productId: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(200),
  sku: z.string().trim().min(1).max(64),
  priceCents: z.number().int().nonnegative().max(10_000_000),
  quantity: z.number().int().positive().max(99),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().min(2).max(2),
});

/**
 * Payment payload accepts a tokenized reference only — never raw card PANs.
 */
export const paymentDetailsSchema = z.object({
  method: z.enum(["card", "paypal"]),
  /** Opaque payment token from the payment provider */
  paymentToken: z.string().trim().min(8).max(256),
  /** Optional last-4 for display; never store full card numbers */
  cardLast4: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
  nameOnCard: z.string().trim().min(1).max(120).optional(),
});

export const createOrderSchema = z.object({
  items: z.array(createOrderItemSchema).min(1).max(50),
  shipping: shippingAddressSchema,
  payment: paymentDetailsSchema,
  currency: z.string().trim().length(3).default("USD"),
});

export type CreateOrderBody = z.infer<typeof createOrderSchema>;
