import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { createMagicLoginToken } from "@/lib/tokens";
import { sendMagicLoginEmail } from "@/lib/email";

const POINTS_RULE_ID = "comparison_unlock_purchase";
const POINTS_AMOUNT = 500;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";

// Ensure the gamification rule for purchases exists (created once, idempotent).
async function ensurePaymentRule() {
  await prisma.gamificationRule.upsert({
    where: { id: POINTS_RULE_ID },
    create: {
      id: POINTS_RULE_ID,
      family: "monetization",
      objective: "comparison_unlock",
      type: "milestone",
      active: true,
      label: "Confronto Sbloccato",
      description: "Hai sbloccato un confronto dettagliato 1v1.",
      looped: false,
      points: POINTS_AMOUNT,
      eventType: "comparison_unlock_purchase",
    },
    update: {},
  });
}

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response("ok", { status: 200 });
  }

  const session = event.data.object;

  // Only process paid sessions
  if (session.payment_status !== "paid") {
    return new Response("ok", { status: 200 });
  }

  const { comparisonKey, p1SteamId, p2SteamId, p1Name, p2Name } = session.metadata ?? {};
  const email = session.customer_details?.email;

  if (!comparisonKey || !email) {
    console.error("[stripe-webhook] Missing comparisonKey or email", { comparisonKey, email });
    return new Response("ok", { status: 200 });
  }

  try {
    await ensurePaymentRule();

    // Find or create Leet9 user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          emailVerified: new Date(), // email verified via Stripe payment
          stripeCustomerId: session.customer ?? null,
        },
      });
    } else if (session.customer && !user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: session.customer },
      });
    }

    // Record the unlock (idempotent — unique constraint on stripeSessionId)
    await prisma.comparisonUnlock.upsert({
      where: { stripeSessionId: session.id },
      create: {
        userId: user.id,
        comparisonKey,
        stripeSessionId: session.id,
      },
      update: {},
    });

    // Award 500 L9 Points (idempotent via unique idempotencyKey on GamificationEvent)
    const idempotencyKey = `comparison_unlock:${session.id}`;
    const existingEvent = await prisma.gamificationEvent.findUnique({ where: { idempotencyKey } });
    if (!existingEvent) {
      const gamEvent = await prisma.gamificationEvent.create({
        data: {
          userId: user.id,
          eventType: "comparison_unlock_purchase",
          payload: { comparisonKey, stripeSessionId: session.id },
          idempotencyKey,
        },
      });
      await prisma.pointsLedger.create({
        data: {
          userId: user.id,
          ruleId: POINTS_RULE_ID,
          eventId: gamEvent.id,
          points: POINTS_AMOUNT,
          note: `Confronto sbloccato: ${comparisonKey}`,
        },
      });
    }

    // Send magic login link so the user lands straight into their account
    const redirectPath = p1SteamId && p2SteamId
      ? `/1v1?p1=${encodeURIComponent(p1SteamId)}&p2=${encodeURIComponent(p2SteamId)}`
      : "/1v1";

    const magicToken = await createMagicLoginToken(email);
    await sendMagicLoginEmail({
      to: email,
      token: magicToken,
      p1Name: p1Name || null,
      p2Name: p2Name || null,
      redirectPath,
    });
  } catch (err) {
    console.error("[stripe-webhook] Processing error:", err);
    return new Response("Internal error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
