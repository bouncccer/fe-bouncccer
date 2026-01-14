"use client";

import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-md px-6">
        <h1 className="text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 mb-6">
          404
        </h1>

        <h2 className="text-2xl font-semibold text-white mb-4">
          Page not found
        </h2>

        <p className="text-gray-400 mb-10 leading-relaxed">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link href="/">
            <Button variant="outline" className="rounded-full px-6 border-white/10 hover:bg-white/5 text-white gap-2 h-12">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
          <Link href="/bounties">
            <Button className="rounded-full px-6 bg-blue-600 hover:bg-blue-500 text-white gap-2 h-12">
              <ArrowLeft className="w-4 h-4" />
              Back to Bounties
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
