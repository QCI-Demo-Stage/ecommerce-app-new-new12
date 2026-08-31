import {
  UserStore,
  toPublicUser,
  type UserRecord,
} from "./userStore";

describe("toPublicUser", () => {
  it("maps a user record to public fields without the password hash", () => {
    const now = new Date();
    const user: UserRecord = {
      id: "id-1",
      email: "buyer@example.com",
      passwordHash: "secret-hash",
      firstName: "Ada",
      lastName: "Lovelace",
      role: "customer",
      isActive: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };

    expect(toPublicUser(user)).toEqual({
      id: "id-1",
      email: "buyer@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      role: "customer",
    });
  });
});

describe("UserStore", () => {
  let store: UserStore;

  beforeEach(() => {
    store = new UserStore();
  });

  describe("create", () => {
    it("creates a customer user with normalized email", async () => {
      const user = await store.create({
        email: "Buyer@Example.COM",
        passwordHash: "hash",
        firstName: "Ada",
        lastName: "Lovelace",
      });

      expect(user.id).toEqual(expect.any(String));
      expect(user.email).toBe("buyer@example.com");
      expect(user.passwordHash).toBe("hash");
      expect(user.role).toBe("customer");
      expect(user.isActive).toBe(true);
      expect(user.lastLoginAt).toBeNull();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it("respects an explicit role", async () => {
      const user = await store.create({
        email: "admin@example.com",
        passwordHash: "hash",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      });

      expect(user.role).toBe("admin");
    });

    it("throws EMAIL_TAKEN when email already exists (case-insensitive)", async () => {
      await store.create({
        email: "buyer@example.com",
        passwordHash: "hash",
        firstName: "Ada",
        lastName: "Lovelace",
      });

      await expect(
        store.create({
          email: "BUYER@example.com",
          passwordHash: "other",
          firstName: "Other",
          lastName: "Person",
        }),
      ).rejects.toThrow("EMAIL_TAKEN");
    });
  });

  describe("findByEmail", () => {
    it("returns null when the email is unknown", async () => {
      await expect(store.findByEmail("missing@example.com")).resolves.toBeNull();
    });

    it("finds a user by email ignoring case", async () => {
      const created = await store.create({
        email: "buyer@example.com",
        passwordHash: "hash",
        firstName: "Ada",
        lastName: "Lovelace",
      });

      const found = await store.findByEmail("BUYER@EXAMPLE.COM");
      expect(found).toEqual(created);
    });
  });

  describe("findById", () => {
    it("returns null for an unknown id", async () => {
      await expect(store.findById("missing")).resolves.toBeNull();
    });

    it("returns the stored user for a known id", async () => {
      const created = await store.create({
        email: "buyer@example.com",
        passwordHash: "hash",
        firstName: "Ada",
        lastName: "Lovelace",
      });

      await expect(store.findById(created.id)).resolves.toEqual(created);
    });
  });

  describe("markLogin", () => {
    it("updates lastLoginAt and updatedAt for an existing user", async () => {
      const created = await store.create({
        email: "buyer@example.com",
        passwordHash: "hash",
        firstName: "Ada",
        lastName: "Lovelace",
      });
      const before = created.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 5));
      await store.markLogin(created.id);

      const updated = await store.findById(created.id);
      expect(updated?.lastLoginAt).toBeInstanceOf(Date);
      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });

    it("no-ops when the user id does not exist", async () => {
      await expect(store.markLogin("missing-id")).resolves.toBeUndefined();
    });
  });
});
