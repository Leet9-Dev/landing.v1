import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function createVerificationToken(email) {
  const token = makeToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  await prisma.verificationToken.deleteMany({ where: { identifier: `email-verify:${email}` } });
  await prisma.verificationToken.create({ data: { identifier: `email-verify:${email}`, token, expires } });
  return token;
}

export async function consumeVerificationToken(token) {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) return null;
  if (!record.identifier.startsWith("email-verify:")) return null;
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return null;
  }
  await prisma.verificationToken.delete({ where: { token } });
  return record.identifier.replace("email-verify:", "");
}

export async function createPasswordResetToken(email) {
  const token = makeToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await prisma.verificationToken.deleteMany({ where: { identifier: `password-reset:${email}` } });
  await prisma.verificationToken.create({ data: { identifier: `password-reset:${email}`, token, expires } });
  return token;
}

export async function consumePasswordResetToken(token) {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) return null;
  if (!record.identifier.startsWith("password-reset:")) return null;
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return null;
  }
  await prisma.verificationToken.delete({ where: { token } });
  return record.identifier.replace("password-reset:", "");
}

export async function createMagicLoginToken(email) {
  const token = makeToken();
  const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await prisma.verificationToken.deleteMany({ where: { identifier: `magic-login:${email}` } });
  await prisma.verificationToken.create({ data: { identifier: `magic-login:${email}`, token, expires } });
  return token;
}

export async function consumeMagicLoginToken(token) {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) return null;
  if (!record.identifier.startsWith("magic-login:")) return null;
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return null;
  }
  await prisma.verificationToken.delete({ where: { token } });
  return record.identifier.replace("magic-login:", "");
}

// Creates a leet9-confirm token for the given email.
// force=false (default): skips creation and returns the existing token if a
//   non-expired one already exists — guards against auto-send spam.
// force=true: always deletes and recreates — used by the manual Resend button.
export async function createLeet9ConfirmToken(email, { force = false } = {}) {
  if (!force) {
    const existing = await prisma.verificationToken.findFirst({
      where: { identifier: `leet9-confirm:${email}`, expires: { gt: new Date() } },
    });
    if (existing) return existing.token;
  }
  const token = makeToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  await prisma.verificationToken.deleteMany({ where: { identifier: `leet9-confirm:${email}` } });
  await prisma.verificationToken.create({ data: { identifier: `leet9-confirm:${email}`, token, expires } });
  return token;
}

// Reads a leet9-confirm token WITHOUT deleting it. This intentional non-deletion
// makes the confirm endpoint idempotent: email prefetch scanners that consume
// the link before the user clicks it do not invalidate the token.
// Returns the email if the token is valid and not expired, null otherwise.
export async function readLeet9ConfirmToken(token) {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) return null;
  if (!record.identifier.startsWith("leet9-confirm:")) return null;
  if (record.expires < new Date()) return null;
  return record.identifier.replace("leet9-confirm:", "");
}
