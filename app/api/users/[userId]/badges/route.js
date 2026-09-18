import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { GAMIFICATION_RULES } from "@/lib/gamification/rulesConfig";

const FAMILY_LABELS = {
  "Overachiever":    "Login Streaks",
  "Relentless":      "Daily Play Time",
  "Public Figure":   "Social Accounts",
  "Versatile Gamer": "Gaming Accounts",
  "Blockchainer":    "Web3 Wallets",
  "Game Sommelier":  "Game Library",
  "Persona":         "Profile Setup",
  "Ambassador":      "Referrals",
  "Social Star":     "Social Graph",
  "Curator":         "Content Creation",
  "Hardcore":        "Game Mastery",
  "OG":              "Veteran Milestones",
  "Most Wanted":     "Share Achievements",
};

// All badge families (those with at least one badgeCollectionPoints rule)
const BADGE_FAMILIES = [...new Set(
  GAMIFICATION_RULES
    .filter((r) => r.brandedName && r.badgeCollectionPoints)
    .map((r) => r.brandedName)
)];

export async function GET(request, { params }) {
  const { userId } = await params;
  if (!userId) return apiError("NOT_FOUND", "User not found.", 404);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) return apiError("NOT_FOUND", "User not found.", 404);

  const badges = await prisma.userBadge.findMany({
    where: { userId },
    select: { brandedName: true, tier: true, unlockedAt: true },
    orderBy: { unlockedAt: "asc" },
  });

  const byFamily = {};
  for (const b of badges) {
    if (!byFamily[b.brandedName]) byFamily[b.brandedName] = [];
    byFamily[b.brandedName].push({ tier: b.tier, unlockedAt: b.unlockedAt });
  }

  const families = BADGE_FAMILIES.map((brandedName) => ({
    brandedName,
    label: FAMILY_LABELS[brandedName] ?? brandedName,
    unlockedTiers: byFamily[brandedName] ?? [],
  })).filter((f) => f.unlockedTiers.length > 0);

  return apiOk({ families });
}
