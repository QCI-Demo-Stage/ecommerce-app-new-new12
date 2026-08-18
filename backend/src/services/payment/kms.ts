import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

/**
 * Simulated application KMS for PCI-DSS scoped token encryption.
 * Uses AES-256-GCM with a key derived from PAYMENT_KMS_SECRET.
 * Production must replace this with a managed KMS (AWS KMS, GCP KMS, Vault).
 * Never logs plaintext tokens or the raw KMS secret.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const VERSION_PREFIX = "v1";

function resolveKeyMaterial(): Buffer {
  const secret = process.env.PAYMENT_KMS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "PAYMENT_KMS_SECRET must be set to a secret of at least 32 characters",
    );
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

/**
 * Encrypt a provider payment-method token. Returns a portable envelope string:
 * v1:<iv_b64>:<tag_b64>:<ciphertext_b64>
 */
export function encryptPaymentToken(plaintextToken: string): string {
  if (!plaintextToken || plaintextToken.trim().length === 0) {
    throw new Error("Cannot encrypt empty payment token");
  }
  const key = resolveKeyMaterial();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintextToken, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION_PREFIX,
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

/** Decrypt a previously encrypted payment token envelope. */
export function decryptPaymentToken(envelope: string): string {
  const parts = envelope.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION_PREFIX) {
    throw new Error("Invalid payment token envelope");
  }
  const [, ivB64, tagB64, ctB64] = parts;
  const key = resolveKeyMaterial();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");
  if (iv.length !== IV_LENGTH || tag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid payment token envelope parameters");
  }
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
