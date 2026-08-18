import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/authenticate";
import { validateBody } from "../middleware/validate";
import { PaymentError, paymentService } from "../payments";

export const paymentsRouter = Router();

const createCustomerSchema = z.object({
  email: z.string().email().max(320),
  name: z.string().min(1).max(200).optional(),
});

const chargeOrderSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  customerToken: z.string().min(1).max(255),
  paymentMethodId: z.string().min(1).max(255),
  orderId: z.string().min(1).max(128).optional(),
  description: z.string().max(500).optional(),
  capture: z.boolean().optional(),
});

const refundOrderSchema = z.object({
  paymentToken: z.string().min(1).max(255),
  amount: z.number().int().positive().optional(),
  reason: z
    .enum(["duplicate", "fraudulent", "requested_by_customer"])
    .optional(),
  orderId: z.string().min(1).max(128).optional(),
});

/**
 * POST /payments/customers
 * Creates a Stripe customer and persists the opaque customer token.
 */
paymentsRouter.post(
  "/customers",
  requireAuth,
  validateBody(createCustomerSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { email, name } = req.body as z.infer<typeof createCustomerSchema>;
      const result = await paymentService.createCustomer({
        email,
        name,
        userId: req.auth?.sub,
      });

      res.status(201).json({
        message: "Customer created",
        customerToken: result.customerToken,
        provider: result.provider,
        tokenId: result.stored.id,
      });
    } catch (err) {
      handlePaymentError(err, res, next);
    }
  },
);

/**
 * POST /payments/charges
 * Charges an order via Stripe PaymentIntent and persists the payment token.
 */
paymentsRouter.post(
  "/charges",
  requireAuth,
  validateBody(chargeOrderSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const body = req.body as z.infer<typeof chargeOrderSchema>;
      const result = await paymentService.chargeOrder({
        ...body,
        userId: req.auth?.sub,
      });

      res.status(201).json({
        message: "Charge completed",
        paymentToken: result.paymentToken,
        status: result.status,
        amount: result.amount,
        currency: result.currency,
        provider: result.provider,
        tokenId: result.stored.id,
      });
    } catch (err) {
      handlePaymentError(err, res, next);
    }
  },
);

/**
 * POST /payments/refunds
 * Refunds a previously charged payment intent and persists the refund token.
 */
paymentsRouter.post(
  "/refunds",
  requireAuth,
  validateBody(refundOrderSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const body = req.body as z.infer<typeof refundOrderSchema>;
      const result = await paymentService.refundOrder({
        ...body,
        userId: req.auth?.sub,
      });

      res.status(201).json({
        message: "Refund created",
        refundToken: result.refundToken,
        paymentToken: result.paymentToken,
        status: result.status,
        amount: result.amount,
        provider: result.provider,
        tokenId: result.stored.id,
      });
    } catch (err) {
      handlePaymentError(err, res, next);
    }
  },
);

function handlePaymentError(
  err: unknown,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof PaymentError) {
    res.status(err.statusCode).json(err.toClientJson());
    return;
  }
  next(err);
}
