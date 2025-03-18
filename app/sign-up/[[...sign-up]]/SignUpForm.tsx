"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSignUp } from "@clerk/nextjs";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Props = {
  setVerifying: (val: boolean) => void;
};

const SignUpForm = ({ setVerifying }: Props) => {
  const { isLoaded, signUp } = useSignUp();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [priceId, setPriceId] = useState(
    process.env.NEXT_PUBLIC_STRIPE_SUB_PRICE_ID || ""
  );
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCardError(null);

    if (!isLoaded && !signUp) return null;

    try {
      if (!elements || !stripe) {
        return;
      }

      // Validate card details first
      const cardEl = elements?.getElement("card");
      if (!cardEl) {
        throw new Error("Card element not found");
      }

      // Check if card is valid before proceeding
      const { error: cardValidationError } = await stripe.createToken(cardEl);
      if (cardValidationError) {
        setCardError(cardValidationError.message || "Invalid card information");
        return;
      }

      let cardToken = "";
      const res = await stripe?.createToken(cardEl);
      cardToken = res?.token?.id || "";

      try {
        await signUp.create({
          emailAddress: email,
          unsafeMetadata: {
            cardToken,
            priceId,
          },
        });

        await signUp.prepareEmailAddressVerification();
        setVerifying(true);
      } catch (clerkError: any) {
        // Handle Clerk specific errors
        if (clerkError.errors && clerkError.errors.length > 0) {
          const firstError = clerkError.errors[0];

          // Check for existing user error
          if (
            firstError.code === "form_identifier_exists" ||
            firstError.message?.includes("already exists") ||
            firstError.message?.includes("taken")
          ) {
            setError(
              "An account with this email already exists. Please sign in instead."
            );
          } else {
            // Handle other Clerk errors
            setError(firstError.message || "Error creating account");
          }
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
        console.error("Clerk error:", clerkError);
      }
    } catch (error: any) {
      console.error(error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Create your account!</CardTitle>
          <CardDescription>
            Welcome! Please fill in the details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div>
            <Label htmlFor="emailAddress">Email address</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              id="emailAddress"
              name="emailAddress"
              required
            />
          </div>
          <div>
            <Label>Select tier</Label>
            <RadioGroup
              className="mt-2"
              value={priceId}
              onValueChange={(e) => setPriceId(e)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value={process.env.NEXT_PUBLIC_STRIPE_SUB_PRICE_ID as string}
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
          {cardError && <p className="text-sm text-red-500">{cardError}</p>}
        </CardContent>
        <CardFooter>
          <div className="grid w-full gap-y-4">
            <Button type="submit" disabled={!isLoaded || loading}>
              {loading ? "Loading..." : "Continue"}
            </Button>
            <Button variant="link" size="sm" asChild>
              <Link href="/sign-in">Already have an account? Sign in</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
};

export default SignUpForm;
