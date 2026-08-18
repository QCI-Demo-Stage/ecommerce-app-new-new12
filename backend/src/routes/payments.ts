import { Router, type Request, type Response, type NextFunction } from "express";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/authenticate";
import { PaymentError, PaymentService } from "../payments";
import {
  chargeOrderSchema,
  createCustomerSchema,
  refundSchema,
  type ChargeOrderBody,
  type CreateCustomerBody,
  type RefundBody,
} from "../validation/paymentSchemas";

export const paymentsRouter = Router();

/** Shared service instance — in-memory stores for this foundation story. */
const paymentService = new PaymentService();

paymentsRouter.use(requireAuth);

/**
 * POST /payments/customers
 * createCustomer — provision provider customer + encrypted token.
 */
paymentsRouter.post(
  "/customers",
  validateBody(createCustomerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as CreateCustomerBody;
      const result = await paymentService.createCustomer(body);
      res.status(201).json(result);
    } catch (err) {
      next(mapPaymentError(err));
    }
  },
);

/**
 * POST /payments/charges
 * chargeOrder — charge a provisioned customer for an order.
 */
paymentsRouter.post(
  "/charges",
  validateBody(chargeOrderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as ChargeOrderBody;
      const result = await paymentService.chargeOrder(body);
      res.status(201).json(result);
    } catch (err) {
      next(mapPaymentError(err));
    }
  },
);

/**
 * POST /payments/refunds
 * refund — full or partial refund of a succeeded charge.
 */
paymentsRouter.post(
  "/refunds",
  validateBody(refundSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as RefundBody;
      const result = await paymentService.refund(body);
      res.status(201).json(result);
    } catch (err) {
      next(mapPaymentError(err));
    }
  },
);

function mapPaymentError(err: unknown): unknown {
  if (err instanceof PaymentError) {
    const payload: {
      error: string;
      message: string;
      details?: Array<{ path: string; message: string }>;
      providerCode?: string | null;
      statusCode: number;
    } = {
      error: err.code,
      message: err.message,
      statusCode: err.httpStatus,
    };
    if (err.details) payload.details = err.details;
    if (err.providerCode) payload.providerCode = err.providerCode;
    return Object.assign(new Error(err.message), payload);
  }
  return err;
}

/**
 * Express error middleware companion — mount after routes.
 * Translates PaymentError-shaped errors into JSON responses.
 */
export function paymentErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (
    err &&
    typeof err === "object" &&
    "statusCode" in err &&
    "error" in err &&
    typeof (err as { statusCode: unknown }).statusCode === "number"
  ) {
    const e = err as {
      statusCode: number;
      error: string;
      message: string;
      details?: Array<{ path: string; message: string }>;
      providerCode?: string | null;
    };
    res.status(e.statusCode).json({
      error: e.error,
      message: e.message,
      ...(e.details ? { details: e.details } : {}),
      ...(e.providerCode ? { providerCode: e.providerCode } : {}),
    });
    return;
  }
  next(err);
}
