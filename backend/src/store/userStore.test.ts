import { UserStore, toPublicUser, type UserRecord } from "./userStore";

describe("userStore", () => {
  it("creates users and finds them by email and id", async () => {
    const store = new UserStore();
    const user = await store.create({
      email: "Ada@Example.com",
      passwordHash: "hash",
      firstName: "Ada",
      lastName: "Lovelace",
    });

    expect(user.email).toBe("ada@example.com");
    expect(user.role).toBe("customer");
    expect(user.isActive).toBe(true);

    await expect(store.findByEmail("ADA@example.com")).resolves.toEqual(user);
    await expect(store.findById(user.id)).resolves.toEqual(user);
  });

  it("rejects duplicate emails", async () => {
    const store = new UserStore();
    await store.create({
      email: "dup@example.com",
      passwordHash: "hash",
      firstName: "A",
      lastName: "B",
    });

    await expect(
      store.create({
        email: "DUP@example.com",
        passwordHash: "hash2",
        firstName: "C",
        lastName: "D",
      }),
    ).rejects.toThrow("EMAIL_TAKEN");
  });

  it("marks login timestamps and ignores unknown users", async () => {
    const store = new UserStore();
    const user = await store.create({
      email: "login@example.com",
      passwordHash: "hash",
      firstName: "Log",
      lastName: "In",
      role: "admin",
    });

    expect(user.lastLoginAt).toBeNull();
    await store.markLogin(user.id);
    const updated = await store.findById(user.id);
    expect(updated?.lastLoginAt).toBeInstanceOf(Date);
    expect(updated?.role).toBe("admin");

    await expect(store.markLogin("missing-id")).resolves.toBeUndefined();
    await expect(store.findByEmail("nobody@example.com")).resolves.toBeNull();
    await expect(store.findById("missing-id")).resolves.toBeNull();
  });

  it("maps a user record to the public shape", () => {
    const record: UserRecord = {
      id: "id-1",
      email: "public@example.com",
      passwordHash: "secret-hash",
      firstName: "Pub",
      lastName: "Lic",
      role: "support",
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(toPublicUser(record)).toEqual({
      id: "id-1",
      email: "public@example.com",
      firstName: "Pub",
      lastName: "Lic",
      role: "support",
    });
  });
});
