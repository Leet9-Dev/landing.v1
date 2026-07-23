import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitProfileUpdatedEvent } from "@/lib/gamification/engine";

const ALLOWED_PRESET_PATHS = new Set([
  "/avatars/controller.svg", "/avatars/sword.svg", "/avatars/skull.svg",
  "/avatars/lightning.svg", "/avatars/fire.svg", "/avatars/trophy.svg",
  "/avatars/diamond.svg", "/avatars/crosshair.svg", "/avatars/crown.svg",
  "/avatars/rocket.svg", "/avatars/shield.svg", "/avatars/l9.svg",
  "/avatars/knight.svg", "/avatars/wizard.svg", "/avatars/archer.svg",
  "/avatars/ninja.svg", "/avatars/robot.svg", "/avatars/alien.svg",
  "/avatars/zombie.svg", "/avatars/spacemarine.svg", "/avatars/cyberpunk.svg",
  "/avatars/elf.svg",
]);

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  // --- Preset selection (JSON) ---
  if (contentType.includes("application/json")) {
    const { url } = await req.json();
    if (!url || !ALLOWED_PRESET_PATHS.has(url)) {
      return Response.json({ ok: false, error: { message: "Invalid avatar" } }, { status: 400 });
    }
    await prisma.user.update({ where: { id: session.user.id }, data: { image: url } });
    emitProfileUpdatedEvent(prisma, session.user.id, "avatar").catch(() => {});
    return Response.json({ ok: true, url });
  }

  // --- Custom upload (multipart) ---
  if (contentType.includes("multipart/form-data")) {
    const { put } = await import("@vercel/blob");
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return Response.json({ ok: false, error: { message: "No file provided" } }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return Response.json({ ok: false, error: { message: "File must be an image" } }, { status: 400 });
    }
    if (file.size > 4.5 * 1024 * 1024) {
      return Response.json({ ok: false, error: { message: "Image must be under 4.5 MB" } }, { status: 400 });
    }
    const ext = file.name.split(".").pop() || "jpg";
    const blob = await put(`avatars/${session.user.id}.${ext}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    await prisma.user.update({ where: { id: session.user.id }, data: { image: blob.url } });
    emitProfileUpdatedEvent(prisma, session.user.id, "avatar").catch(() => {});
    return Response.json({ ok: true, url: blob.url });
  }

  return Response.json({ ok: false, error: { message: "Unsupported content type" } }, { status: 415 });
}
