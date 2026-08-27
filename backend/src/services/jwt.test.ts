import jwt from "jsonwebtoken";
import {
  issueTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
} from "./jwt";

describe("jwt service", () => {
  const claims = {
    userId: "user-1",
    email: "shopper@example.com",
    role: "customer" as const,
  };

  it("issues a bearer token pair", () => {
    const tokens = issueTokenPair(claims);
    expect(tokens.tokenType).toBe("Bearer");
    expect(tokens.expiresIn).toBe("15m");
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
  });

  it("verifies access and refresh tokens", () => {
    const tokens = issueTokenPair(claims);
    const access = verifyAccessToken(tokens.accessToken);
    const refresh = verifyRefreshToken(tokens.refreshToken);

    expect(access).toMatchObject({
      sub: "user-1",
      email: "shopper@example.com",
      role: "customer",
      typ: "access",
    });
    expect(refresh).toMatchObject({
      sub: "user-1",
      email: "shopper@example.com",
      role: "customer",
      typ: "refresh",
    });
  });

  it("rejects access tokens without the access typ claim", () => {
    const secret = process.env.JWT_ACCESS_SECRET as string;
    const token = jwt.sign(
      { sub: "user-1", email: "a@b.co", role: "customer", typ: "refresh" },
      secret,
      { algorithm: "HS256" },
    );
    expect(() => verifyAccessToken(token)).toThrow("INVALID_ACCESS_TOKEN");
  });

  it("rejects refresh tokens without the refresh typ claim", () => {
    const secret = process.env.JWT_REFRESH_SECRET as string;
    const token = jwt.sign(
      { sub: "user-1", email: "a@b.co", role: "customer", typ: "access" },
      secret,
      { algorithm: "HS256" },
    );
    expect(() => verifyRefreshToken(token)).toThrow("INVALID_REFRESH_TOKEN");
  });

  it("requires JWT secrets of at least 32 characters", () => {
    const previous = process.env.JWT_ACCESS_SECRET;
    process.env.JWT_ACCESS_SECRET = "too-short";
    expect(() => issueTokenPair(claims)).toThrow(/JWT_ACCESS_SECRET/);
    process.env.JWT_ACCESS_SECRET = previous;
  });
});
