import Stripe from "stripe";

let _stripe;

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    });
  }
  return _stripe;
}

export { makeComparisonKey } from "@/lib/billing-utils";
