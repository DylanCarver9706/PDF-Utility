import { clerk } from "@/lib/clerk";
import { stripe } from "@/lib/stripe";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req as NextRequest);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // First try to get the subscription ID from the request body
    let subscriptionId;
    try {
      const body = await req.json();
      subscriptionId = body.subscriptionId;
    } catch (e) {
      // If parsing fails or no body provided, fall back to metadata
      const user = await clerk.users.getUser(userId);
      subscriptionId = user.publicMetadata.stripeSubscriptionId as string;
    }

    if (!subscriptionId) {
      return new NextResponse("No active subscription found", { status: 404 });
    }

    // Cancel the subscription at period end
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Subscription cancellation error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
