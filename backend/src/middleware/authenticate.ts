import type { NextFunction, Request, Response } from "express";
import {
  verifyAccessToken,
  type AccessTokenPayload,
} from "../services/jwt";

export interface AuthenticatedRequest extends Request {
  auth?: AccessTokenPayload;
}

/**
 * JWT bearer middleware — validates the access token on each protected request.
 * Expects `Authorization: Bearer <accessToken>`.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({
      error: "unauthorized",
      message: "Missing or invalid Authorization header",
    });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({
      error: "unauthorized",
      message: "Missing access token",
    });
    return;
  }

  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({
      error: "unauthorized",
      message: "Invalid or expired access token",
    });
  }
}
