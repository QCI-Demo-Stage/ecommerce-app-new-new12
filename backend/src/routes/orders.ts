import { Router, type Response, type NextFunction } from "express";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/authenticate";
import { validateBody } from "../middleware/validate";
import {
  createOrderSchema,
  type CreateOrderBody,
} from "../validation/orderSchemas";
import {
  orderStore,
  toPublicOrder,
  toPublicOrderDetail,
} from "../store/orderStore";

export const ordersRouter = Router();

function sanitizePositiveInt(
  raw: unknown,
  fallback: number,
  max: number,
): number {
  const value = typeof raw === "string" ? Number(raw) : Number(raw);
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(1, Math.floor(value)));
}

/**
 * GET /api/orders
 * Paginated order history for the authenticated user.
 */
ordersRouter.get(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.auth?.sub;
      if (!userId) {
        res.status(401).json({
          error: "unauthorized",
          message: "Missing authenticated user",
        });
        return;
      }

      const page = sanitizePositiveInt(req.query.page, 1, 10_000);
      const pageSize = sanitizePositiveInt(req.query.pageSize, 10, 50);

      const { items, total } = await orderStore.listByUserId(userId, {
        page,
        pageSize,
      });

      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      res.status(200).json({
        items: items.map(toPublicOrder),
        page,
        pageSize,
        total,
        totalPages,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/orders
 * Place an order from checkout. Designed to complete well under the 2s UX budget.
 * Accepts tokenized payment only — never raw card PANs.
 */
ordersRouter.post(
  "/",
  requireAuth,
  validateBody(createOrderSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const started = Date.now();
    try {
      const userId = req.auth?.sub;
      if (!userId) {
        res.status(401).json({
          error: "unauthorized",
          message: "Missing authenticated user",
        });
        return;
      }

      const body = req.body as CreateOrderBody;
      const totalCents = body.items.reduce(
        (sum, item) => sum + item.priceCents * item.quantity,
        0,
      );

      if (totalCents <= 0) {
        res.status(400).json({
          error: "validation_error",
          message: "Order total must be greater than zero",
        });
        return;
      }

      const shipping = {
        fullName: body.shipping.fullName,
        line1: body.shipping.line1,
        line2: body.shipping.line2?.trim()
          ? body.shipping.line2.trim()
          : undefined,
        city: body.shipping.city,
        state: body.shipping.state,
        postalCode: body.shipping.postalCode,
        country: body.shipping.country.toUpperCase(),
      };

      const order = await orderStore.create({
        userId,
        status: "paid",
        totalCents,
        currency: body.currency ?? "USD",
        items: body.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          priceCents: item.priceCents,
          quantity: item.quantity,
        })),
        shipping,
        payment: {
          method: body.payment.method,
          paymentToken: body.payment.paymentToken,
          cardLast4: body.payment.cardLast4,
        },
      });

      const elapsedMs = Date.now() - started;
      res.status(201).json({
        message: "Order placed successfully",
        order: toPublicOrderDetail(order),
        meta: { processingMs: elapsedMs },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/orders/:id
 * Single order detail for the authenticated owner.
 */
ordersRouter.get(
  "/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.auth?.sub;
      if (!userId) {
        res.status(401).json({
          error: "unauthorized",
          message: "Missing authenticated user",
        });
        return;
      }

      const id = String(req.params.id ?? "").trim();
      if (!id || !/^[a-zA-Z0-9-]+$/.test(id)) {
        res.status(400).json({
          error: "validation_error",
          message: "Invalid order id",
        });
        return;
      }

      const order = await orderStore.findById(id);
      if (!order || order.userId !== userId) {
        res.status(404).json({
          error: "not_found",
          message: "Order not found",
        });
        return;
      }

      res.status(200).json(toPublicOrderDetail(order));
    } catch (err) {
      next(err);
    }
  },
);
