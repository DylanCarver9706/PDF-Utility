import Stripe from "stripe";

// Use empty string fallback for build time, actual value will be used at runtime
const apiKey = process.env.STRIPE_SECRET_KEY || "";

export const stripe = new Stripe(apiKey, {
  // apiVersion: "2023-10-16",
  typescript: true,
});
