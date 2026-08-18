/**
 * Simulated KMS (Key Management Service) for PCI-DSS friendly tokenization.
 *
 * Production systems must use a real KMS / HSM (AWS KMS, GCP Cloud KMS, etc.).
 * This module simulates envelope encryption with AES-256-GCM so the application
 * never persists plaintext payment method tokens.
 *
 * Security notes:
 * - Ciphertext format: base64(iv || authTag || ciphertext)
 * - Key material is loaded from PAYMENT_KMS_KEY (32-byte base64 or hex)
 * - Raw PANs / CVVs must never reach this layer
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export interface KmsClient {
  encrypt(plaintext: string): Promise<string>;
  decrypt(ciphertext: string): Promise<string>;
}

function resolveKeyMaterial(): Buffer {
  const raw = process.env.PAYMENT_KMS_KEY;
  if (!raw) {
    // Deterministic local-dev key derived from a non-secret label.
    // NEVER use this path in production — require PAYMENT_KMS_KEY.
    if ((process.env.NODE_ENV ?? "development") === "production") {
      throw new Error("PAYMENT_KMS_KEY must be configured in production");
    }
    return createHash("sha256").update("local-dev-payment-kms-key").digest();
  }

  // Prefer base64 (44 chars for 32 bytes), fall back to hex (64 chars).
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  const decoded = Buffer.from(raw, "base64");
  if (decoded.length !== 32) {
    throw new Error("PAYMENT_KMS_KEY must decode to exactly 32 bytes");
  }
  return decoded;
}

export class SimulatedKmsClient implements KmsClient {
  private readonly key: Buffer;

  constructor(key?: Buffer) {
    this.key = key ?? resolveKeyMaterial();
    if (this.key.length !== 32) {
      throw new Error("KMS key must be 32 bytes for AES-256-GCM");
    }
  }

  async encrypt(plaintext: string): Promise<string> {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString("base64");
  }

  async decrypt(ciphertext: string): Promise<string> {
    const payload = Buffer.from(ciphertext, "base64");
    if (payload.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
      throw new Error("Invalid ciphertext payload");
    }
    const iv = payload.subarray(0, IV_LENGTH);
    const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  }
}
