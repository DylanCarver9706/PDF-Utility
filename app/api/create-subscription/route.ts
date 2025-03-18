import { NextResponse, NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { clerk } from "@/lib/clerk";
import { getAuth } from "@clerk/nextjs/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req as NextRequest);

    if (!userId) {
      return new NextResponse(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to create a subscription",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { cardToken, priceId, email } = await req.json();

    if (!cardToken || !priceId || !email) {
      return new NextResponse(
        JSON.stringify({
          error: "Missing fields",
          message: "Required fields are missing",
          details: {
            cardToken: !cardToken ? "Missing card token" : null,
            priceId: !priceId ? "Missing price ID" : null,
            email: !email ? "Missing email" : null,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    try {
      // Create payment method
      const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: { token: cardToken },
      });

      // Create customer
      const customer = await stripe.customers.create({
        email,
        payment_method: paymentMethod.id,
      });

      // Create subscription with expanded latest_invoice including payment_intent
      // This allows us to check if payment needs additional actions
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        default_payment_method: paymentMethod.id,
        items: [{ price: priceId }],
        expand: ["latest_invoice.payment_intent"],
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      // If payment requires additional action
      if (paymentIntent && paymentIntent.status === "requires_action") {
        // Return information needed for handling the required action
        return NextResponse.json({
          success: false,
          requires_action: true,
          payment_intent_client_secret: paymentIntent.client_secret,
          subscription_id: subscription.id,
          customer_id: customer.id,
          message: "Payment requires additional authentication",
        });
      }

      // If payment failed
      if (paymentIntent && paymentIntent.status === "requires_payment_method") {
        // Clean up the created subscription
        await stripe.subscriptions.cancel(subscription.id);

        return NextResponse.json(
          {
            success: false,
            error: "payment_failed",
            message:
              "Your payment method was declined. Please try another payment method.",
          },
          { status: 400 }
        );
      }

      // Update Clerk user with Stripe metadata
      await clerk.users.updateUser(userId, {
        publicMetadata: {
          stripeCustomerId: customer.id,
          stripeSubscriptionId: subscription.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Subscription created successfully",
        customerId: customer.id,
        subscriptionId: subscription.id,
        status: subscription.status,
      });
    } catch (stripeError: any) {
      // Handle specific Stripe errors
      console.error("Stripe error:", stripeError);

      let errorMessage = "An error occurred processing your payment";
      let errorCode = "payment_error";
      let statusCode = 400;

      if (stripeError.type === "StripeCardError") {
        // Card declined or other card error
        errorMessage = stripeError.message || "Your card was declined";
        errorCode = "card_error";
      } else if (stripeError.type === "StripeInvalidRequestError") {
        // Invalid parameters were supplied to Stripe's API
        errorMessage = "Invalid payment information";
        errorCode = "invalid_request";
      } else if (stripeError.type === "StripeAPIError") {
        // Stripe's API servers encountered an error
        errorMessage = "Payment service unavailable. Please try again later";
        errorCode = "api_error";
        statusCode = 503;
      } else {
        // Any other type of stripe error
        statusCode = 500;
        errorCode = "unknown_error";
      }

      return NextResponse.json(
        {
          success: false,
          error: errorCode,
          message: errorMessage,
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      {
        success: false,
        error: "server_error",
        message: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}
