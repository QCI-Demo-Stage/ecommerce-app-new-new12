import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from "./authSchemas";

describe("authSchemas", () => {
  it("accepts a valid registration payload", () => {
    const parsed = registerSchema.parse({
      email: " shopper@example.com ",
      password: "password1",
      firstName: " Sam ",
      lastName: " Shopper ",
    });

    expect(parsed).toEqual({
      email: "shopper@example.com",
      password: "password1",
      firstName: "Sam",
      lastName: "Shopper",
    });
  });

  it("rejects weak registration passwords and invalid emails", () => {
    expect(() =>
      registerSchema.parse({
        email: "not-an-email",
        password: "short",
        firstName: "A",
        lastName: "B",
      }),
    ).toThrow();
  });

  it("accepts login and refresh payloads", () => {
    expect(
      loginSchema.parse({ email: "a@b.co", password: "x" }),
    ).toEqual({ email: "a@b.co", password: "x" });
    expect(refreshSchema.parse({ refreshToken: "token" })).toEqual({
      refreshToken: "token",
    });
  });

  it("rejects empty login password and refresh token", () => {
    expect(() =>
      loginSchema.parse({ email: "a@b.co", password: "" }),
    ).toThrow();
    expect(() => refreshSchema.parse({ refreshToken: "" })).toThrow();
  });
});
