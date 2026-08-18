import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { apiOk, apiError } from "@/lib/api/response";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const comparisonKey = searchParams.get("key");
  const stripeSessionId = searchParams.get("session_id");

  if (!comparisonKey) return apiError("MISSING_PARAMS", "key is required.", 400);

  const session = await getServerSession(authOptions).catch(() => null);

  // Logged-in user: check their ComparisonUnlock record
  if (session?.user?.id) {
    const unlock = await prisma.comparisonUnlock.findUnique({
      where: { userId_comparisonKey: { userId: session.user.id, comparisonKey } },
    });
    if (unlock) return apiOk({ unlocked: true, source: "db" });
  }

  // Just paid (redirect back from Stripe): verify session directly with Stripe
  if (stripeSessionId) {
    try {
      const stripe = getStripe();
      const stripeSession = await stripe.checkout.sessions.retrieve(stripeSessionId);
      if (
        stripeSession.payment_status === "paid" &&
        stripeSession.metadata?.comparisonKey === comparisonKey
      ) {
        return apiOk({ unlocked: true, source: "stripe_session" });
      }
    } catch {
      // Stripe verification failed — fall through to locked
    }
  }

  return apiOk({ unlocked: false });
}
