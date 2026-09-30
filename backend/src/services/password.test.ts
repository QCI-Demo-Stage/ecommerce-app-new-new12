jest.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

import bcrypt from "bcrypt";
import { hashPassword, verifyPassword } from "./password";

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("password service", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.BCRYPT_SALT_ROUNDS;
    mockedBcrypt.hash.mockReset();
    mockedBcrypt.compare.mockReset();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("hashPassword", () => {
    it("hashes plaintext with default salt rounds when env is unset", async () => {
      mockedBcrypt.hash.mockResolvedValue("hashed-password" as never);

      const result = await hashPassword("Secret123!");

      expect(mockedBcrypt.hash).toHaveBeenCalledWith("Secret123!", 12);
      expect(result).toBe("hashed-password");
    });

    it("uses configured BCRYPT_SALT_ROUNDS when valid (10–15)", async () => {
      process.env.BCRYPT_SALT_ROUNDS = "10";
      mockedBcrypt.hash.mockResolvedValue("hashed" as never);

      await hashPassword("plain");

      expect(mockedBcrypt.hash).toHaveBeenCalledWith("plain", 10);
    });

    it("accepts upper-bound salt rounds of 15", async () => {
      process.env.BCRYPT_SALT_ROUNDS = "15";
      mockedBcrypt.hash.mockResolvedValue("hashed" as never);

      await hashPassword("plain");

      expect(mockedBcrypt.hash).toHaveBeenCalledWith("plain", 15);
    });

    it("falls back to default rounds when BCRYPT_SALT_ROUNDS is below 10", async () => {
      process.env.BCRYPT_SALT_ROUNDS = "3";
      mockedBcrypt.hash.mockResolvedValue("hashed" as never);

      await hashPassword("plain");

      expect(mockedBcrypt.hash).toHaveBeenCalledWith("plain", 12);
    });

    it("falls back to default rounds when BCRYPT_SALT_ROUNDS is above 15", async () => {
      process.env.BCRYPT_SALT_ROUNDS = "20";
      mockedBcrypt.hash.mockResolvedValue("hashed" as never);

      await hashPassword("plain");

      expect(mockedBcrypt.hash).toHaveBeenCalledWith("plain", 12);
    });

    it("falls back to default rounds when BCRYPT_SALT_ROUNDS is non-numeric", async () => {
      process.env.BCRYPT_SALT_ROUNDS = "not-a-number";
      mockedBcrypt.hash.mockResolvedValue("hashed" as never);

      await hashPassword("plain");

      expect(mockedBcrypt.hash).toHaveBeenCalledWith("plain", 12);
    });
  });

  describe("verifyPassword", () => {
    it("returns true when bcrypt.compare reports a match", async () => {
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const ok = await verifyPassword("Secret123!", "$2b$12$storedhash");

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        "Secret123!",
        "$2b$12$storedhash",
      );
      expect(ok).toBe(true);
    });

    it("returns false when bcrypt.compare reports a mismatch", async () => {
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const ok = await verifyPassword("wrong", "$2b$12$storedhash");

      expect(ok).toBe(false);
    });
  });
});
