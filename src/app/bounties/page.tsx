"use client";

import React from "react";
import { useRouter } from "next/navigation";
import BountyManager from "../../components/BountyManager";
import { Target, Sparkles } from "lucide-react";

export default function BountiesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] opacity-30" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] opacity-30" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 relative z-10">
        {/* Page Header */}
        <div className="mb-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-400 mb-6">
            <Sparkles className="w-3 h-3" />
            <span>Explore Opportunities</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Bounties
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            Discover tasks, solve challenges, and earn crypto. All payments are secured by smart contracts on Arbitrum.
          </p>
        </div>

        {/* Bounty Manager Component */}
        <BountyManager />
      </div>
    </div>
  );
}
