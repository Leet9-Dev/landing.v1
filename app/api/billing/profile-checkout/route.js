import { getStripe } from "@/lib/stripe";
import { apiError } from "@/lib/api/response";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_BODY", "Invalid JSON body.", 400);
  }

  const { gameId } = body ?? {};

  const successUrl = gameId
    ? `${BASE_URL}/app/discovery/${gameId}?unlocked=1&session_id={CHECKOUT_SESSION_ID}`
    : `${BASE_URL}/app/discovery?unlocked=1`;
  const cancelUrl = gameId
    ? `${BASE_URL}/app/discovery/${gameId}`
    : `${BASE_URL}/app/discovery`;

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "Leet9 — Sblocca le tue Stats",
            description: "Accedi alle tue statistiche personali su tutti i giochi",
          },
          unit_amount: 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      comparisonKey: "profile_access",
      gameId: gameId ?? "",
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: "auto",
    customer_creation: "always",
  });

  return Response.json({ ok: true, url: session.url });
}
