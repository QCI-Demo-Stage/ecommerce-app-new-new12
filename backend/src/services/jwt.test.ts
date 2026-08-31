jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
}));

import jwt from "jsonwebtoken";
import {
  issueTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
} from "./jwt";

const mockedJwt = jwt as jest.Mocked<typeof jwt>;

const ACCESS_SECRET = "test-access-secret-at-least-32-chars!!";
const REFRESH_SECRET = "test-refresh-secret-at-least-32-chars!";

describe("jwt service", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      JWT_ACCESS_SECRET: ACCESS_SECRET,
      JWT_REFRESH_SECRET: REFRESH_SECRET,
    };
    delete process.env.JWT_ACCESS_EXPIRES_IN;
    delete process.env.JWT_REFRESH_EXPIRES_IN;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("issueTokenPair", () => {
    it("signs access and refresh tokens with expected claims and defaults", () => {
      mockedJwt.sign
        .mockReturnValueOnce("access.jwt" as never)
        .mockReturnValueOnce("refresh.jwt" as never);

      const pair = issueTokenPair({
        userId: "user-1",
        email: "buyer@example.com",
        role: "customer",
      });

      expect(mockedJwt.sign).toHaveBeenNthCalledWith(
        1,
        {
          sub: "user-1",
          email: "buyer@example.com",
          role: "customer",
          typ: "access",
        },
        ACCESS_SECRET,
        { expiresIn: "15m", algorithm: "HS256" },
      );
      expect(mockedJwt.sign).toHaveBeenNthCalledWith(
        2,
        {
          sub: "user-1",
          email: "buyer@example.com",
          role: "customer",
          typ: "refresh",
        },
        REFRESH_SECRET,
        { expiresIn: "7d", algorithm: "HS256" },
      );
      expect(pair).toEqual({
        accessToken: "access.jwt",
        refreshToken: "refresh.jwt",
        tokenType: "Bearer",
        expiresIn: "15m",
      });
    });

    it("honors custom expiry env values", () => {
      process.env.JWT_ACCESS_EXPIRES_IN = "30m";
      process.env.JWT_REFRESH_EXPIRES_IN = "14d";
      mockedJwt.sign
        .mockReturnValueOnce("a" as never)
        .mockReturnValueOnce("r" as never);

      const pair = issueTokenPair({
        userId: "user-2",
        email: "admin@example.com",
        role: "admin",
      });

      expect(mockedJwt.sign).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ typ: "access", role: "admin" }),
        ACCESS_SECRET,
        { expiresIn: "30m", algorithm: "HS256" },
      );
      expect(mockedJwt.sign).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ typ: "refresh" }),
        REFRESH_SECRET,
        { expiresIn: "14d", algorithm: "HS256" },
      );
      expect(pair.expiresIn).toBe("30m");
    });

    it("throws when JWT_ACCESS_SECRET is missing", () => {
      delete process.env.JWT_ACCESS_SECRET;

      expect(() =>
        issueTokenPair({
          userId: "u",
          email: "a@b.com",
          role: "customer",
        }),
      ).toThrow(/JWT_ACCESS_SECRET must be set/);
    });

    it("throws when JWT_ACCESS_SECRET is shorter than 32 characters", () => {
      process.env.JWT_ACCESS_SECRET = "too-short";

      expect(() =>
        issueTokenPair({
          userId: "u",
          email: "a@b.com",
          role: "customer",
        }),
      ).toThrow(/JWT_ACCESS_SECRET must be set/);
    });

    it("throws when JWT_REFRESH_SECRET is missing", () => {
      delete process.env.JWT_REFRESH_SECRET;

      expect(() =>
        issueTokenPair({
          userId: "u",
          email: "a@b.com",
          role: "customer",
        }),
      ).toThrow(/JWT_REFRESH_SECRET must be set/);
    });
  });

  describe("verifyAccessToken", () => {
    it("returns payload when token is a valid access token", () => {
      const payload = {
        sub: "user-1",
        email: "buyer@example.com",
        role: "customer" as const,
        typ: "access" as const,
      };
      mockedJwt.verify.mockReturnValue(payload as never);

      const result = verifyAccessToken("access.token");

      expect(mockedJwt.verify).toHaveBeenCalledWith("access.token", ACCESS_SECRET, {
        algorithms: ["HS256"],
      });
      expect(result).toEqual(payload);
    });

    it("throws INVALID_ACCESS_TOKEN when typ is not access", () => {
      mockedJwt.verify.mockReturnValue({
        sub: "user-1",
        email: "buyer@example.com",
        role: "customer",
        typ: "refresh",
      } as never);

      expect(() => verifyAccessToken("bad.token")).toThrow("INVALID_ACCESS_TOKEN");
    });

    it("throws INVALID_ACCESS_TOKEN when sub is missing", () => {
      mockedJwt.verify.mockReturnValue({
        email: "buyer@example.com",
        role: "customer",
        typ: "access",
      } as never);

      expect(() => verifyAccessToken("bad.token")).toThrow("INVALID_ACCESS_TOKEN");
    });

    it("throws INVALID_ACCESS_TOKEN when decoded value is not an object", () => {
      mockedJwt.verify.mockReturnValue("not-an-object" as never);

      expect(() => verifyAccessToken("bad.token")).toThrow("INVALID_ACCESS_TOKEN");
    });

    it("propagates jwt.verify errors (e.g. expired token)", () => {
      mockedJwt.verify.mockImplementation(() => {
        throw new Error("jwt expired");
      });

      expect(() => verifyAccessToken("expired.token")).toThrow("jwt expired");
    });

    it("throws when access secret is not configured", () => {
      delete process.env.JWT_ACCESS_SECRET;

      expect(() => verifyAccessToken("token")).toThrow(/JWT_ACCESS_SECRET must be set/);
    });
  });

  describe("verifyRefreshToken", () => {
    it("returns payload when token is a valid refresh token", () => {
      const payload = {
        sub: "user-1",
        email: "buyer@example.com",
        role: "customer" as const,
        typ: "refresh" as const,
      };
      mockedJwt.verify.mockReturnValue(payload as never);

      const result = verifyRefreshToken("refresh.token");

      expect(mockedJwt.verify).toHaveBeenCalledWith(
        "refresh.token",
        REFRESH_SECRET,
        { algorithms: ["HS256"] },
      );
      expect(result).toEqual(payload);
    });

    it("throws INVALID_REFRESH_TOKEN when typ is not refresh", () => {
      mockedJwt.verify.mockReturnValue({
        sub: "user-1",
        email: "buyer@example.com",
        role: "customer",
        typ: "access",
      } as never);

      expect(() => verifyRefreshToken("bad.token")).toThrow(
        "INVALID_REFRESH_TOKEN",
      );
    });

    it("throws INVALID_REFRESH_TOKEN when sub is not a string", () => {
      mockedJwt.verify.mockReturnValue({
        sub: 123,
        email: "buyer@example.com",
        role: "customer",
        typ: "refresh",
      } as never);

      expect(() => verifyRefreshToken("bad.token")).toThrow(
        "INVALID_REFRESH_TOKEN",
      );
    });

    it("throws INVALID_REFRESH_TOKEN when decoded is null", () => {
      mockedJwt.verify.mockReturnValue(null as never);

      expect(() => verifyRefreshToken("bad.token")).toThrow(
        "INVALID_REFRESH_TOKEN",
      );
    });

    it("throws when refresh secret is not configured", () => {
      delete process.env.JWT_REFRESH_SECRET;

      expect(() => verifyRefreshToken("token")).toThrow(
        /JWT_REFRESH_SECRET must be set/,
      );
    });
  });
});
