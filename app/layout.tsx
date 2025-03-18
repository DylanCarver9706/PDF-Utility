import type { Metadata } from "next";
import { PostHogProvider } from "./providers/posthog";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PDF Utility",
  description: "PDF Utility",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className} suppressHydrationWarning>
          <PostHogProvider>
            <Navbar />
            {children}
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
