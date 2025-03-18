"use client";

import { Merge, Scissors, Settings } from "lucide-react";

export function Hero() {
  return (
    <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
          Your All-in-One PDF Solution
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
          Edit, convert, and manipulate PDF files with ease. Split, merge, and transform your documents in just a few clicks.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Scissors className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Split PDF</h3>
            <p className="text-gray-600">Separate pages into individual PDF files</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Merge className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Merge PDF</h3>
            <p className="text-gray-600">Combine multiple PDFs into one file</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Settings className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Convert PDF</h3>
            <p className="text-gray-600">Transform PDFs to various formats</p>
          </div>
        </div>
      </div>
    </div>
  );
}