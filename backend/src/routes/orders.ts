import { Router, type Response, type NextFunction } from "express";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/authenticate";
import { orderStore, toPublicOrder } from "../store/orderStore";

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
