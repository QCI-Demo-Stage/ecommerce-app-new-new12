import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "../store/userStore";

export type TokenType = "access" | "refresh";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  typ: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  typ: "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: string;
}

function requireSecret(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET"): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(
      `${name} must be set to a secret of at least 32 characters`,
    );
  }
  return value;
}

function accessExpiresIn(): string {
  return process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
}

function refreshExpiresIn(): string {
  return process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";
}

export function issueTokenPair(claims: {
  userId: string;
  email: string;
  role: UserRole;
}): TokenPair {
  const accessSecret = requireSecret("JWT_ACCESS_SECRET");
  const refreshSecret = requireSecret("JWT_REFRESH_SECRET");
  const expiresIn = accessExpiresIn();

  const accessPayload: AccessTokenPayload = {
    sub: claims.userId,
    email: claims.email,
    role: claims.role,
    typ: "access",
  };

  const refreshPayload: RefreshTokenPayload = {
    sub: claims.userId,
    email: claims.email,
    role: claims.role,
    typ: "refresh",
  };

  const accessOptions: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
    algorithm: "HS256",
  };

  const refreshOptions: SignOptions = {
    expiresIn: refreshExpiresIn() as SignOptions["expiresIn"],
    algorithm: "HS256",
  };

  const accessToken = jwt.sign(accessPayload, accessSecret, accessOptions);
  const refreshToken = jwt.sign(refreshPayload, refreshSecret, refreshOptions);

  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn,
  };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const secret = requireSecret("JWT_ACCESS_SECRET");
  const decoded = jwt.verify(token, secret, {
    algorithms: ["HS256"],
  });

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    (decoded as AccessTokenPayload).typ !== "access" ||
    typeof (decoded as AccessTokenPayload).sub !== "string"
  ) {
    throw new Error("INVALID_ACCESS_TOKEN");
  }

  return decoded as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const secret = requireSecret("JWT_REFRESH_SECRET");
  const decoded = jwt.verify(token, secret, {
    algorithms: ["HS256"],
  });

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    (decoded as RefreshTokenPayload).typ !== "refresh" ||
    typeof (decoded as RefreshTokenPayload).sub !== "string"
  ) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  return decoded as RefreshTokenPayload;
}
