import { hashPassword, verifyPassword } from "./password";

describe("password service", () => {
  it("hashes a password and verifies the correct plaintext", async () => {
    const hash = await hashPassword("correct-horse-battery");
    expect(hash).not.toBe("correct-horse-battery");
    expect(hash.startsWith("$2")).toBe(true);
    await expect(verifyPassword("correct-horse-battery", hash)).resolves.toBe(
      true,
    );
  });

  it("rejects an incorrect plaintext", async () => {
    const hash = await hashPassword("correct-horse-battery");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("falls back to default rounds for invalid BCRYPT_SALT_ROUNDS", async () => {
    const previous = process.env.BCRYPT_SALT_ROUNDS;
    process.env.BCRYPT_SALT_ROUNDS = "3";
    const hash = await hashPassword("another-secret");
    process.env.BCRYPT_SALT_ROUNDS = previous;
    await expect(verifyPassword("another-secret", hash)).resolves.toBe(true);
  });
});
