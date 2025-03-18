"use client";

import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-100 rounded-full">
              <FileQuestion className="h-16 w-16 text-red-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Whoops! This page isn&apos;t found or this feature isn&apos;t quite ready yet
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Don&apos;t worry! You can head back to our homepage and explore our available PDF tools.
          </p>
          <Link href="/">
            <Button className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg h-auto">
              Back to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}