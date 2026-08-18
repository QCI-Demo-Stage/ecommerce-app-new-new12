import { Router, type Request, type Response, type NextFunction } from "express";
import { validateBody } from "../middleware/validate";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from "../validation/authSchemas";
import { hashPassword, verifyPassword } from "../services/password";
import {
  issueTokenPair,
  verifyRefreshToken,
} from "../services/jwt";
import { toPublicUser, userStore } from "../store/userStore";

export const authRouter = Router();

/**
 * POST /auth/register
 * Creates a user with a bcrypt-hashed password. Does not issue tokens;
 * clients should call /auth/login after registration.
 */
authRouter.post(
  "/register",
  validateBody(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName } = req.body as {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
      };

      const existing = await userStore.findByEmail(email);
      if (existing) {
        res.status(409).json({
          error: "conflict",
          message: "An account with this email already exists",
        });
        return;
      }

      const passwordHash = await hashPassword(password);
      const user = await userStore.create({
        email,
        passwordHash,
        firstName,
        lastName,
      });

      res.status(201).json({
        message: "Registration successful",
        user: toPublicUser(user),
      });
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_TAKEN") {
        res.status(409).json({
          error: "conflict",
          message: "An account with this email already exists",
        });
        return;
      }
      next(err);
    }
  },
);

/**
 * POST /auth/login
 * Verifies credentials and returns access + refresh JWTs.
 */
authRouter.post(
  "/login",
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as {
        email: string;
        password: string;
      };

      const user = await userStore.findByEmail(email);
      if (!user || !user.isActive) {
        res.status(401).json({
          error: "unauthorized",
          message: "Invalid email or password",
        });
        return;
      }

      const passwordOk = await verifyPassword(password, user.passwordHash);
      if (!passwordOk) {
        res.status(401).json({
          error: "unauthorized",
          message: "Invalid email or password",
        });
        return;
      }

      await userStore.markLogin(user.id);

      const tokens = issueTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(200).json({
        message: "Login successful",
        user: toPublicUser(user),
        ...tokens,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /auth/refresh
 * Validates a refresh token and issues a new access + refresh token pair.
 */
authRouter.post(
  "/refresh",
  validateBody(refreshSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };

      let payload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch {
        res.status(401).json({
          error: "unauthorized",
          message: "Invalid or expired refresh token",
        });
        return;
      }

      const user = await userStore.findById(payload.sub);
      if (!user || !user.isActive) {
        res.status(401).json({
          error: "unauthorized",
          message: "User not found or inactive",
        });
        return;
      }

      const tokens = issueTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(200).json({
        message: "Token refresh successful",
        ...tokens,
      });
    } catch (err) {
      next(err);
    }
  },
);
