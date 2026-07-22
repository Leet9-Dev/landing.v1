// AES-256-GCM encryption/decryption for PSN NPSSO tokens.
//
// The key is read from PSN_CREDENTIAL_KEY (32 bytes, base64-encoded).
// Encrypted payloads are stored in PlatformAccount.metadata as:
//   { npsso: { enc: string, iv: string, tag: string } }
//
// NPSSO tokens are PSN session credentials — treat them like passwords.
// They must never be logged, returned to clients, or stored unencrypted.

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";

function getKey() {
  const raw = process.env.PSN_CREDENTIAL_KEY;
  if (!raw) return null;
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("PSN_CREDENTIAL_KEY must be 32 bytes (base64-encoded).");
  return buf;
}

export function hasCredentialKey() {
  return Boolean(process.env.PSN_CREDENTIAL_KEY);
}

/**
 * Encrypt an NPSSO token for storage in the DB.
 * Throws if PSN_CREDENTIAL_KEY is not set or is the wrong length.
 *
 * @param {string} npsso
 * @returns {{ enc: string, iv: string, tag: string }}
 */
export function encryptNpsso(npsso) {
  const key = getKey();
  if (!key) throw new Error("PSN_CREDENTIAL_KEY is not configured.");
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(npsso, "utf8"), cipher.final()]);
  return {
    enc: enc.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

/**
 * Decrypt an NPSSO token from DB storage.
 *
 * @param {{ enc: string, iv: string, tag: string }} stored
 * @returns {string} plaintext NPSSO
 */
export function decryptNpsso(stored) {
  const key = getKey();
  if (!key) throw new Error("PSN_CREDENTIAL_KEY is not configured.");
  const decipher = createDecipheriv(ALGO, key, Buffer.from(stored.iv, "base64"));
  decipher.setAuthTag(Buffer.from(stored.tag, "base64"));
  return (
    decipher.update(Buffer.from(stored.enc, "base64")).toString("utf8") +
    decipher.final("utf8")
  );
}
