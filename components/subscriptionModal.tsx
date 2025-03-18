"use client";

import { useUser, SignUpButton } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import PricingFeatures from "./pricingFeatures";

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SubscriptionModal({
  open,
  onOpenChange,
}: SubscriptionModalProps) {
  const { isSignedIn } = useUser();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[850px] max-h-[85vh] bg-white border-2 border-red-700 p-5 rounded-[8px]"
        aria-describedby="subscription-description"
      >
        <DialogHeader className="space-y-8">
          <DialogTitle className="text-4xl font-bold text-center text-black">
            Unlock Premium PDF Tools
          </DialogTitle>
          <DialogDescription id="subscription-description" className="sr-only">
            Subscribe to unlock unlimited access to all PDF tools and advanced
            features
          </DialogDescription>
        </DialogHeader>

        <div className="text-center space-y-6">
          <div className="text-black text-xl leading-relaxed">
            {isSignedIn
              ? "Get unlimited access to all PDF tools and advanced features"
              : "Subscribe now to unlock unlimited access to all PDF tools and advanced features!"}
          </div>

          {/* Pricing Section */}
          <div className="bg-gray-100 rounded-2xl p-8 mt-6">
            <div className="flex flex-col items-center gap-0">
              <div className="flex items-baseline justify-center gap-2 text-black">
                <span className="text-5xl font-bold">$9.99</span>
                <span className="text-xl text-black">/ month</span>
              </div>
              <PricingFeatures />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-5 mt-2">
            <DialogClose asChild>
              <div className="text-4xl text-white bg-red-600 hover:bg-red-700 p-8 rounded-xl w-full max-w-md mx-auto flex justify-center items-center cursor-pointer">
                <SignUpButton />
              </div>
            </DialogClose>
        </div>
        <div className="text-black text-sm flex flex-col items-center">
          Cancel anytime. Secure payment via Stripe.
        </div>
      </DialogContent>
    </Dialog>
  );
}
