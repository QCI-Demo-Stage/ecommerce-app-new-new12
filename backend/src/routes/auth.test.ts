import request from "supertest";
import app from "../index";
import { userStore } from "../store/userStore";
import { hashPassword } from "../services/password";
import { issueTokenPair } from "../services/jwt";

describe("auth routes and api surface", () => {
  const uniqueEmail = (label: string) =>
    `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;

  it("exposes health, ready, and api metadata endpoints", async () => {
    await request(app).get("/health").expect(200);
    await request(app).get("/ready").expect(200);
    const api = await request(app).get("/api").expect(200);
    expect(api.body.name).toContain("Ecommerce");
  });

  it("registers, logs in, refreshes, and returns /api/me", async () => {
    const email = uniqueEmail("flow");

    const register = await request(app)
      .post("/auth/register")
      .send({
        email,
        password: "password12",
        firstName: "Flow",
        lastName: "User",
      })
      .expect(201);

    expect(register.body.user.email).toBe(email.toLowerCase());

    const login = await request(app)
      .post("/auth/login")
      .send({ email, password: "password12" })
      .expect(200);

    expect(login.body.accessToken).toBeTruthy();
    expect(login.body.refreshToken).toBeTruthy();

    const me = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${login.body.accessToken}`)
      .expect(200);

    expect(me.body.email).toBe(email.toLowerCase());

    const refreshed = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: login.body.refreshToken })
      .expect(200);

    expect(refreshed.body.accessToken).toBeTruthy();
  });

  it("rejects duplicate registration and bad credentials", async () => {
    const email = uniqueEmail("dup");

    await request(app)
      .post("/auth/register")
      .send({
        email,
        password: "password12",
        firstName: "Dup",
        lastName: "User",
      })
      .expect(201);

    await request(app)
      .post("/auth/register")
      .send({
        email,
        password: "password12",
        firstName: "Dup",
        lastName: "User",
      })
      .expect(409);

    await request(app)
      .post("/auth/login")
      .send({ email, password: "wrong-password" })
      .expect(401);

    await request(app)
      .post("/auth/login")
      .send({ email: uniqueEmail("missing"), password: "password12" })
      .expect(401);
  });

  it("rejects invalid refresh tokens and inactive users", async () => {
    await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: "not-valid" })
      .expect(401);

    const email = uniqueEmail("inactive");
    const passwordHash = await hashPassword("password12");
    const user = await userStore.create({
      email,
      passwordHash,
      firstName: "In",
      lastName: "Active",
    });
    user.isActive = false;

    const tokens = issueTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await request(app)
      .post("/auth/login")
      .send({ email, password: "password12" })
      .expect(401);

    await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: tokens.refreshToken })
      .expect(401);
  });

  it("rejects malformed registration bodies", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "bad", password: "x", firstName: "", lastName: "" })
      .expect(400);
  });
});
