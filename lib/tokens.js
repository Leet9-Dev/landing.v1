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
