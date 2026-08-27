import type { NextFunction, Response } from "express";
import { requireAuth, type AuthenticatedRequest } from "./authenticate";
import { issueTokenPair } from "../services/jwt";

function mockResponse(): Response {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response;
}

describe("requireAuth middleware", () => {
  it("rejects missing Authorization headers", () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("rejects empty bearer tokens", () => {
    const req = {
      headers: { authorization: "Bearer   " },
    } as AuthenticatedRequest;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("attaches auth claims for a valid access token", () => {
    const tokens = issueTokenPair({
      userId: "u-1",
      email: "auth@example.com",
      role: "customer",
    });
    const req = {
      headers: { authorization: `Bearer ${tokens.accessToken}` },
    } as AuthenticatedRequest;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.auth?.sub).toBe("u-1");
    expect(req.auth?.email).toBe("auth@example.com");
  });

  it("rejects invalid access tokens", () => {
    const req = {
      headers: { authorization: "Bearer not-a-real-token" },
    } as AuthenticatedRequest;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});
