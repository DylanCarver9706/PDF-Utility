"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUser } from "@clerk/nextjs";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import React, { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReactivateSubFormProps {
  onCancel: () => void;
  onSuccess: (result: { subscriptionId: string; customerId: string }) => void;
}

const ReactivateSubForm = ({ onCancel, onSuccess }: ReactivateSubFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [priceId, setPriceId] = useState(process.env.STRIPE_SUB_PRICE_ID);
  const [error, setError] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCardError(null);

    try {
      if (!elements || !stripe) {
        setError("Payment system not available. Please try again later.");
        return;
      }

      // Validate card details first
      const cardEl = elements?.getElement("card");
      if (!cardEl) {
        setError(
          "Card element not found. Please refresh the page and try again."
        );
        return;
      }

      // Check if card is valid before proceeding
      const { error: cardValidationError } = await stripe.createToken(cardEl);
      if (cardValidationError) {
        setCardError(cardValidationError.message || "Invalid card information");
        setLoading(false);
        return;
      }

      let cardToken = "";
      const res = await stripe?.createToken(cardEl);
      cardToken = res?.token?.id || "";

      if (!cardToken) {
        setError("Failed to process card information. Please try again.");
        return;
      }

      const actualPriceId = priceId;

      // Call our API route to handle subscription creation
      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardToken,
          priceId: actualPriceId,
          email: user?.emailAddresses[0].emailAddress,
          userId: user?.id,
        }),
      });

      const subscriptionResult = await response.json();

      if (!response.ok) {
        throw new Error(
          subscriptionResult.message || "Failed to create subscription"
        );
      }

      // Handle requires_action case for 3D Secure etc.
      if (
        subscriptionResult.requires_action &&
        subscriptionResult.payment_intent_client_secret
      ) {
        const { error: stripeError, paymentIntent } =
          await stripe.confirmCardPayment(
            subscriptionResult.payment_intent_client_secret
          );

        if (stripeError) {
          // Payment failed after user interaction
          setError(
            stripeError.message ||
              "Payment authentication failed. Please try again."
          );
          return;
        } else if (paymentIntent.status === "succeeded") {
          // Payment successful after authentication
          toast.success("Payment succeeded", {
            description: "Your subscription has been activated.",
          });

          onSuccess({
            subscriptionId: subscriptionResult.subscription_id,
            customerId: subscriptionResult.customer_id,
          });
          return;
        }
      }

      if (!subscriptionResult.success) {
        setError(
          subscriptionResult.message || "Failed to process subscription"
        );
        return;
      }

      // Notify the parent component that subscription was created successfully
      onSuccess(subscriptionResult);
      toast.success("Subscription activated", {
        description: "Your subscription has been successfully activated.",
      });
    } catch (error: any) {
      console.error(error);
      setError(
        error.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="grid gap-y-4 mt-4">
          {error && (
            <Alert variant="destructive" className="text-center">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div>
            <Label>Select tier</Label>
            <RadioGroup
              className="mt-2"
              value={priceId}
              onValueChange={(e) => setPriceId(e)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value={process.env.STRIPE_SUB_PRICE_ID as string}
                  id="option-one"
                />
                <Label htmlFor="option-one">Pro</Label>
              </div>
              {/* <div className="flex items-center space-x-2">
                <RadioGroupItem value="price_1PtnpSHt8UXMeRVTcY3NDTDP" id="option-two" />
                <Label htmlFor="option-two">Enterprise</Label>
              </div> */}
            </RadioGroup>
          </div>
          <Label>Payment details</Label>
          <div className="rounded border p-2">
            <CardElement />
          </div>
          {cardError && (
            <p className="text-sm text-red-500 text-center">{cardError}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Processing..." : "Continue"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default ReactivateSubForm;
