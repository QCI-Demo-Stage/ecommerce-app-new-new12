import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { validateBody } from "./validate";

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

describe("validateBody middleware", () => {
  const schema = z.object({ name: z.string().min(1) });

  it("parses a valid body and continues", () => {
    const req = { body: { name: "ok" } } as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    validateBody(schema)(req, res, next);

    expect(req.body).toEqual({ name: "ok" });
    expect(next).toHaveBeenCalledWith();
  });

  it("responds 400 for schema validation failures", () => {
    const req = { body: { name: "" } } as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    validateBody(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });

  it("forwards unexpected errors to next", () => {
    const exploding = {
      parse() {
        throw new Error("boom");
      },
    };
    const req = { body: {} } as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    validateBody(exploding as never)(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
