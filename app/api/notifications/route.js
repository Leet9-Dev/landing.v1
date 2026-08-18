import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return apiOk({ notifications, unreadCount });
}

export async function PATCH(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return apiOk({ marked: true });
}
