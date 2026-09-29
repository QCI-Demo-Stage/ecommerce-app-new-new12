import { Router, type Request, type Response, type NextFunction } from "express";
import { productStore } from "../store/productStore";

export const productsRouter = Router();

/**
 * GET /products
 * Paginated product catalog. Query: page, pageSize, category, q.
 */
productsRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page !== undefined ? Number(req.query.page) : undefined;
      const pageSize =
        req.query.pageSize !== undefined ? Number(req.query.pageSize) : undefined;
      const category =
        typeof req.query.category === "string" ? req.query.category : undefined;
      const q = typeof req.query.q === "string" ? req.query.q : undefined;

      if (page !== undefined && (!Number.isFinite(page) || page < 1)) {
        res.status(400).json({
          error: "validation_error",
          message: "page must be a positive integer",
        });
        return;
      }

      if (
        pageSize !== undefined &&
        (!Number.isFinite(pageSize) || pageSize < 1 || pageSize > 48)
      ) {
        res.status(400).json({
          error: "validation_error",
          message: "pageSize must be an integer between 1 and 48",
        });
        return;
      }

      const result = await productStore.list({ page, pageSize, category, q });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /products/:id
 * Single product detail by UUID.
 */
productsRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id ?? "").trim();
      if (!id) {
        res.status(400).json({
          error: "validation_error",
          message: "Product id is required",
        });
        return;
      }

      const product = await productStore.findById(id);
      if (!product) {
        res.status(404).json({
          error: "not_found",
          message: "Product not found",
        });
        return;
      }

      res.status(200).json(product);
    } catch (err) {
      next(err);
    }
  },
);
