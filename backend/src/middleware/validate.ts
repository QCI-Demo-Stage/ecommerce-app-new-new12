import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";

/** Validate `req.body` against a Zod schema; respond 400 on failure. */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: "validation_error",
          message: "Request body failed validation",
          details: err.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
}
