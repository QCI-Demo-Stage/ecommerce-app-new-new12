import { Router, type Response, type NextFunction } from "express";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/authenticate";
import { validateBody } from "../middleware/validate";
import { updateProfileSchema } from "../validation/profileSchemas";
import { toPublicUser, userStore } from "../store/userStore";

export const meRouter = Router();

/**
 * GET /api/me
 * Returns the authenticated user's public profile.
 */
meRouter.get(
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

      const user = await userStore.findById(userId);
      if (!user || !user.isActive) {
        res.status(401).json({
          error: "unauthorized",
          message: "User not found or inactive",
        });
        return;
      }

      res.status(200).json(toPublicUser(user));
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /api/me
 * Updates editable profile fields for the authenticated user.
 */
meRouter.patch(
  "/",
  requireAuth,
  validateBody(updateProfileSchema),
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

      const { firstName, lastName, email } = req.body as {
        firstName: string;
        lastName: string;
        email?: string;
      };

      const updated = await userStore.updateProfile(userId, {
        firstName,
        lastName,
        email,
      });

      res.status(200).json({
        message: "Profile updated",
        user: toPublicUser(updated),
      });
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_TAKEN") {
        res.status(409).json({
          error: "conflict",
          message: "An account with this email already exists",
        });
        return;
      }
      if (err instanceof Error && err.message === "USER_NOT_FOUND") {
        res.status(404).json({
          error: "not_found",
          message: "User not found",
        });
        return;
      }
      next(err);
    }
  },
);
