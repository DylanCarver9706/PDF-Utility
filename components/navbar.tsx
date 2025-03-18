"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";
import SubscriptionModal from "./subscriptionModal";
import { useState } from "react";

export function Navbar() {
  const { isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <span className="text-3xl font-bold text-red-600">PDF</span>
            <span className="text-3xl font-bold text-gray-900">Utils</span>
          </Link>
          <div className="flex items-center">
            <div className="hidden md:flex ml-10 space-x-1">
              <Link href="/merge-pdf">
                <Button variant="ghost" className="text-gray-700 text-md">
                  MERGE PDF
                </Button>
              </Link>
              <Link href="/split-pdf">
                <Button variant="ghost" className="text-gray-700 text-md">
                  SPLIT PDF
                </Button>
              </Link>
              <Link href="/compress-pdf">
                <Button variant="ghost" className="text-gray-700 text-md">
                  COMPRESS PDF
                </Button>
              </Link>
              <Link href="/convert-pdf">
                <Button
                  variant="ghost"
                  className="text-gray-700 text-md flex items-center"
                >
                  CONVERT PDF <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/all-tools">
                <Button
                  variant="ghost"
                  className="text-gray-700 text-md flex items-center"
                >
                  ALL PDF TOOLS <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {!isSignedIn && isLoaded && (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm" className="text-base">
                    Login
                  </Button>
                </Link>
                <Button
                  onClick={() => setShowSubscribeModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Unlock Pro
                </Button>
              </>
            )}
            {isSignedIn && (
              <>
                
              </>
            )}
            {isSignedIn && isLoaded && (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none bg-transparent">
                  <User className="h-7 w-7 stroke-[hsl(0, 0.00%, 0.00%)] hover:stroke-red-600 transition-colors" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 mt-2 p-2 bg-white border border-[hsl(222,47%,25%)] space-y-1"
                >
                  <DropdownMenuItem
                    asChild
                    className="px-4 py-3 cursor-pointer text-black hover:bg-gray-100 focus:bg-gray-100 rounded-md transition-colors flex items-center justify-center no-underline"
                  >
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="px-4 py-3 cursor-pointer text-black hover:bg-gray-100 focus:bg-gray-100 rounded-md transition-colors flex items-center justify-center no-underline"
                  >
                    <Link href="/subscription">Subscription</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="px-4 py-3 cursor-pointer text-[hsl(0, 100.00%, 50.00%)] hover:text-red-600 hover:bg-gray-100 focus:bg-gray-100 rounded-md transition-colors flex items-center justify-center"
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
      <SubscriptionModal
        open={showSubscribeModal}
        onOpenChange={setShowSubscribeModal}
      />
    </nav>
  );
}
