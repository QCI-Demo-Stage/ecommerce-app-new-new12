import "dotenv/config";
import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { authRouter } from "./routes/auth";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "./middleware/authenticate";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const appVersion = process.env.APP_VERSION ?? "0.0.0";

app.use(cors());
app.use(express.json({ limit: "100kb" }));

/** Liveness — process is up. */
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", version: appVersion });
});

/** Readiness — ready to accept traffic. */
app.get("/ready", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ready", version: appVersion });
});

app.get("/api", (_req: Request, res: Response) => {
  res.json({
    name: "Ecommerce App New API",
    version: appVersion,
    environment: process.env.NODE_ENV ?? "development",
  });
});

/** OAuth2/JWT authentication endpoints */
app.use("/auth", authRouter);

/**
 * Example protected route — JWT validated on every request via requireAuth.
 * Downstream APIs should mount the same middleware.
 */
app.get(
  "/api/me",
  requireAuth,
  (req: AuthenticatedRequest, res: Response) => {
    res.status(200).json({
      userId: req.auth?.sub,
      email: req.auth?.email,
      role: req.auth?.role,
    });
  },
);

app.use(
  (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void => {
    // eslint-disable-next-line no-console
    console.error("[error]", err instanceof Error ? err.message : err);
    res.status(500).json({
      error: "internal_error",
      message: "An unexpected error occurred",
    });
  },
);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on port ${port}`);
});

export default app;
