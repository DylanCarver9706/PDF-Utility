import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subscriptionId = searchParams.get("subscriptionId");

  if (!subscriptionId) {
    return NextResponse.json({ isActive: false });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    return NextResponse.json({
      isActive: subscription.status === "active",
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (error) {
    console.error("Error retrieving subscription:", error);
    return NextResponse.json({ isActive: false });
  }
} 