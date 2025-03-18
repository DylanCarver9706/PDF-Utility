"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "./ui/button";
import Link from "next/link";
import { FileText, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-[60px] max-w-screen-2xl items-center">
        <div className="flex flex-1 items-center justify-between h-full">
          <Link
            href="/"
            className="flex items-center space-x-4 hover:opacity-90 transition no-underline"
          >
            <FileText className="h-14 w-14 text-[hsl(210,40%,98%)]" />
            <span className="text-4xl font-bold text-[hsl(210,40%,98%)]">
              PDF Utility
            </span>
          </Link>

          <Button
            asChild
            className="bg-[hsl(222,47%,11%)] hover:bg-[hsl(222,47%,15%)] h-[40px] w-[75px] px-4 rounded-[8px]"
          >
            <Link
              href="/split-pdf"
              className="no-underline text-[hsl(210,40%,98%)] text-base font-medium"
            >
              Split PDF
            </Link>
          </Button>

          <nav className="flex items-center">
            {!isSignedIn && isLoaded && (
              <Button
                asChild
                className="bg-[hsl(222,47%,11%)] hover:bg-[hsl(222,47%,15%)] h-[40px] w-[75px] px-4 rounded-[8px]"
              >
                <Link
                  href="/sign-in"
                  className="no-underline text-[hsl(210,40%,98%)] text-base font-medium"
                >
                  Sign in
                </Link>
              </Button>
            )}
            {isSignedIn && isLoaded && (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none bg-transparent">
                  <User className="h-7 w-7 stroke-[hsl(210,40%,98%)] hover:stroke-[hsl(210,40%,90%)] transition-colors" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 mt-2 p-2 bg-[hsl(222,47%,11%)] border border-[hsl(222,47%,25%)] space-y-1"
                >
                  <DropdownMenuItem
                    asChild
                    className="px-4 py-3 cursor-pointer text-[hsl(210,40%,98%)] hover:bg-[hsl(222,47%,15%)] focus:bg-[hsl(222,47%,15%)] rounded-md transition-colors flex items-center justify-center no-underline"
                  >
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="px-4 py-3 cursor-pointer text-[hsl(210,40%,98%)] hover:bg-[hsl(222,47%,15%)] focus:bg-[hsl(222,47%,15%)] rounded-md transition-colors flex items-center justify-center no-underline"
                  >
                    <Link href="/subscription">Subscription</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="px-4 py-3 cursor-pointer text-red-400 hover:text-red-400 hover:bg-[hsl(222,47%,15%)] focus:bg-[hsl(222,47%,15%)] rounded-md transition-colors flex items-center justify-center"
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
