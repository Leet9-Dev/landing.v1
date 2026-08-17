import { getStripe, makeComparisonKey } from "@/lib/stripe";
import { apiError } from "@/lib/api/response";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_BODY", "Invalid JSON body.", 400);
  }

  const { p1SteamId, p2SteamId, p1Name, p2Name } = body ?? {};
  if (!p1SteamId || !p2SteamId) {
    return apiError("MISSING_PARAMS", "p1SteamId and p2SteamId are required.", 400);
  }

  const comparisonKey = makeComparisonKey(p1SteamId, p2SteamId);
  const stripe = getStripe();

  const successUrl = `${BASE_URL}/1v1?p1=${encodeURIComponent(p1SteamId)}&p2=${encodeURIComponent(p2SteamId)}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${BASE_URL}/1v1?p1=${encodeURIComponent(p1SteamId)}&p2=${encodeURIComponent(p2SteamId)}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "Confronto Dettagliato 1v1",
            description: p1Name && p2Name
              ? `${p1Name} vs ${p2Name} — analisi completa`
              : "Sblocca i dettagli completi del confronto",
          },
          unit_amount: 100, // €1.00
        },
        quantity: 1,
      },
    ],
    metadata: {
      comparisonKey,
      p1SteamId,
      p2SteamId,
      p1Name: p1Name ?? "",
      p2Name: p2Name ?? "",
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: "auto",
    customer_creation: "always",
  });

  return Response.json({ ok: true, url: session.url });
}
