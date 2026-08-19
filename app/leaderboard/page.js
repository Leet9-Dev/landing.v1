import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LeaderboardView from "./_client/LeaderboardView";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";
const NEW_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000;

async function fetchLeaderboardRows() {
  const ledger = await prisma.pointsLedger.groupBy({
    by: ["userId"],
    _sum: { points: true },
    orderBy: { _sum: { points: "desc" } },
    take: 100,
  });

  if (!ledger.length) return [];

  const userIds = ledger.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true, createdAt: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));
  const now = Date.now();

  return ledger
    .map((r, i) => {
      const u = userMap.get(r.userId);
      if (!u) return null;
      return {
        rank: i + 1,
        userId: u.id,
        name: u.name ?? "Gamer",
        image: u.image ?? null,
        l9Points: r._sum.points ?? 0,
        isNew: now - new Date(u.createdAt).getTime() < NEW_THRESHOLD_MS,
      };
    })
    .filter(Boolean);
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const challengeUserId = params?.challenge;

  if (!challengeUserId) {
    return {
      title: "Leaderboard L9 Points — Leet9",
      description: "I migliori 100 gamer su Leet9 per L9 Points. Aggiornata ogni 5 minuti.",
      openGraph: {
        title: "Leaderboard L9 Points — Leet9",
        description: "I migliori 100 gamer su Leet9 per L9 Points.",
        url: `${BASE_URL}/leaderboard`,
        siteName: "Leet9",
        images: [{ url: `${BASE_URL}/og-default.png`, width: 1200, height: 630 }],
      },
      twitter: { card: "summary_large_image" },
    };
  }

  // Challenge mode — generate a personalized OG for this user
  try {
    const rows = await fetchLeaderboardRows();
    const row = rows.find((r) => r.userId === challengeUserId);

    if (!row) throw new Error("not found");

    const ogUrl = new URL(`${BASE_URL}/api/og/leaderboard`);
    ogUrl.searchParams.set("name", row.name);
    ogUrl.searchParams.set("rank", String(row.rank));
    ogUrl.searchParams.set("points", String(row.l9Points));
    if (row.image) ogUrl.searchParams.set("avatar", row.image);

    const title = `${row.name} ti sfida su Leet9 — #${row.rank} Leaderboard`;
    const description = `Riesci a battere ${row.name}? ${row.l9Points.toLocaleString()} L9 Points. Accetta la sfida su Leet9.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${BASE_URL}/leaderboard?challenge=${challengeUserId}`,
        siteName: "Leet9",
        images: [{ url: ogUrl.toString(), width: 1200, height: 630 }],
      },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return {
      title: "Leaderboard L9 Points — Leet9",
      description: "I migliori 100 gamer su Leet9.",
    };
  }
}

export const revalidate = 300;

export default async function LeaderboardPage() {
  const [session, rows] = await Promise.all([
    getServerSession(authOptions).catch(() => null),
    fetchLeaderboardRows(),
  ]);

  const sessionUserId = session?.user?.id ?? null;

  let myRank = null;
  if (sessionUserId) {
    const myRow = rows.find((r) => r.userId === sessionUserId);
    if (myRow) {
      myRank = myRow.rank;
    } else {
      const myTotal = await prisma.pointsLedger.aggregate({
        where: { userId: sessionUserId },
        _sum: { points: true },
      });
      const myPoints = myTotal._sum.points ?? 0;
      const allAbove = await prisma.pointsLedger.groupBy({
        by: ["userId"],
        _sum: { points: true },
        having: { points: { _sum: { gt: myPoints } } },
      });
      myRank = allAbove.length + 1;
    }
  }

  return (
    <LeaderboardView rows={rows} myRank={myRank} sessionUserId={sessionUserId} />
  );
}
