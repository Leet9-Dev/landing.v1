import { MOCK_USER } from "@/lib/mock/currentUser";
import { MOCK_PLATFORM_ACCOUNTS } from "@/lib/mock/platformAccounts";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET() {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const platformsConnected = MOCK_PLATFORM_ACCOUNTS.filter(
    (p) => p.status === "connected"
  ).map((p) => p.provider);

  return apiOk({ ...MOCK_USER, platformsConnected });
}
