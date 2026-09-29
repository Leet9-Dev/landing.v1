import { requireSession } from "@/lib/api/auth";
import { apiOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { captureRankSnapshot } from "@/lib/scoring/rankSnapshot";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const snapshot = await captureRankSnapshot(prisma, session.user.id);
  return apiOk({ rank: snapshot.rank, l9Points: snapshot.l9Points });
}
