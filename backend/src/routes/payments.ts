import { Router, type Request, type Response, type NextFunction } from "express";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/authenticate";
import {
  chargeOrderSchema,
  createCustomerSchema,
  refundSchema,
} from "../validation/paymentSchemas";
import { paymentService } from "../services/payment/PaymentService";
import { isPaymentError } from "../services/payment/errors";

export const paymentsRouter = Router();

function handlePaymentError(
  err: unknown,
  res: Response,
  next: NextFunction,
): void {
  if (isPaymentError(err)) {
    res.status(err.httpStatus).json({
      error: err.code,
      message: err.message,
    });
    return;
  }
  next(err);
}

/**
 * POST /payments/customers — createCustomer
 */
paymentsRouter.post(
  "/customers",
  requireAuth,
  validateBody(createCustomerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await paymentService.createCustomer(req.body);
      res.status(201).json(result);
    } catch (err) {
      handlePaymentError(err, res, next);
    }
  },
);

/**
 * POST /payments/charges — chargeOrder
 */
paymentsRouter.post(
  "/charges",
  requireAuth,
  validateBody(chargeOrderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await paymentService.chargeOrder(req.body);
      res.status(201).json(result);
    } catch (err) {
      handlePaymentError(err, res, next);
    }
  },
);

/**
 * POST /payments/refunds — refund
 */
paymentsRouter.post(
  "/refunds",
  requireAuth,
  validateBody(refundSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await paymentService.refund(req.body);
      res.status(201).json(result);
    } catch (err) {
      handlePaymentError(err, res, next);
    }
  },
);
