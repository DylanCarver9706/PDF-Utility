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

    // Parse the request body to get the subscription ID
    const body = await req.json();
    let subscriptionId = body.subscriptionId;

    // Fall back to metadata if no subscription ID in the request
    if (!subscriptionId) {
      const user = await clerk.users.getUser(userId);
      subscriptionId = user.publicMetadata.stripeSubscriptionId as string;
    }

    if (!subscriptionId) {
      return new NextResponse("No subscription found", { status: 404 });
    }

    // Retrieve the current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Handle active subscriptions marked for cancellation at period end
    if (subscription.status === "active" && subscription.cancel_at_period_end) {
      // Simply remove the cancellation flag
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      return NextResponse.json({
        success: true,
        message: "Subscription successfully reactivated",
        action: "updated",
      });
    }
    // Handle fully cancelled subscriptions
    else if (subscription.status === "canceled") {
      // Get the customer ID from the old subscription
      const customerId = subscription.customer as string;

      // Get the items from the old subscription
      const items = subscription.items.data.map((item) => ({
        price: item.price.id,
        quantity: item.quantity,
      }));

      // Create a new subscription with the same parameters
      const newSubscription = await stripe.subscriptions.create({
        customer: customerId,
        items: items,
      });

      // Update user's metadata with the new subscription ID
      await clerk.users.updateUser(userId, {
        publicMetadata: {
          ...body.publicMetadata,
          stripeSubscriptionId: newSubscription.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "New subscription created successfully",
        action: "created",
        newSubscriptionId: newSubscription.id,
      });
    }
    // Handle other cases (subscription already active, etc.)
    else {
      return new NextResponse(
        `Subscription is in status "${subscription.status}" and does not need reactivation`,
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Subscription reactivation error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
