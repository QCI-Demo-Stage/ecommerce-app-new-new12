import bcrypt from "bcrypt";

const DEFAULT_ROUNDS = 12;

function saltRounds(): number {
  const raw = process.env.BCRYPT_SALT_ROUNDS;
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_ROUNDS;
  if (!Number.isFinite(parsed) || parsed < 10 || parsed > 15) {
    return DEFAULT_ROUNDS;
  }
  return parsed;
}

/** Hash a plaintext password with bcrypt. Never persist the plaintext. */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, saltRounds());
}

/** Constant-time comparison of plaintext password against a stored bcrypt hash. */
export async function verifyPassword(
  plaintext: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plaintext, passwordHash);
}
