"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { Footer } from "../components/Footer";
import {
  ArrowRight,
  Lock,
  ShieldCheck,
  Zap,
  Globe,
  ChevronRight
} from "lucide-react";
import { useChainId } from "wagmi";
import { BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";

// --- Components ---

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.8, delay, ease: [0.2, 0.65, 0.3, 0.9] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const BentoCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => {
  return (
    <FadeIn delay={delay} className={`bg-[#111111] rounded-3xl p-8 border border-white/5 hover:border-white/10 transition-colors duration-500 overflow-hidden relative group ${className}`}>
      {children}
    </FadeIn>
  );
};

// --- Main Page ---

export default function Home() {
  const router = useRouter();
  const chainId = useChainId();
  const isBase = chainId === BASE_SEPOLIA_CHAIN_ID;
  const networkName = isBase ? "Base" : "Arbitrum";

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-500 origin-left z-50"
        style={{ scaleX }}
      />

      <main>
        {/* HERO SECTION */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/20 rounded-[100%] blur-[120px] opacity-50 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[600px] bg-purple-500/10 rounded-[100%] blur-[100px] opacity-30" />
          </div>

          <div className="relative z-10 text-center max-w-5xl mx-auto space-y-8">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-400 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Live on {networkName} Sepolia
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                Bouncccer: bounty for<br />
                builder and influencers
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
                Ship code. Create content. Get paid instantly. <br />
                The <span className="text-blue-400 font-medium">JobFi</span> layer for the gig economy.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  Start Bouncing
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full text-lg font-medium transition-all flex items-center gap-2"
                >
                  How it Works
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </FadeIn>
          </div>

          {/* Hero Visual / Dashboard Preview */}
          <FadeIn delay={0.5} className="mt-20 relative w-full max-w-6xl">
            <div className="relative rounded-t-3xl overflow-hidden border-t border-l border-r border-white/10 bg-[#0A0A0A] shadow-2xl shadow-blue-900/20">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
              <div className="p-2 flex items-center gap-2 border-b border-white/5 bg-black/50 backdrop-blur-md">
                <div className="flex gap-1.5 px-3">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>
                <div className="flex-1 text-center text-xs font-mono text-gray-600">bouncccer.eth</div>
              </div>
              <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 opacity-80">
                {/* Abstract UI Representation */}
                <div className="col-span-2 space-y-6">
                  <div className="h-32 rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
                  <div className="space-y-3">
                    <div className="h-4 w-3/4 rounded bg-white/10" />
                    <div className="h-4 w-1/2 rounded bg-white/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 rounded-xl bg-white/5 border border-white/5" />
                    <div className="h-24 rounded-xl bg-white/5 border border-white/5" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-full rounded-2xl bg-gradient-to-b from-blue-500/10 to-transparent border border-blue-500/20 p-6">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 mb-4" />
                    <div className="h-4 w-2/3 rounded bg-blue-500/20 mb-2" />
                    <div className="h-3 w-full rounded bg-white/5" />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* FEATURES BENTO GRID */}
        <section id="features" className="py-32 px-6 bg-[#050505]">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="mb-16 text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6">
                All Signal.<br />
                <span className="text-gray-500">No Noise.</span>
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Smart Escrow (Large) */}
              <BentoCard className="md:col-span-2 min-h-[400px] flex flex-col justify-between group">
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">Locked Funds. Zero Rugs.</h3>
                  <p className="text-gray-400 max-w-md text-lg">
                    Funds are locked in a smart contract <strong>before</strong> you start working.
                    You deliver the goods, you get the bag. It's that simple.
                  </p>
                </div>
                <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-30 group-hover:opacity-50 transition-opacity">
                  <div className="absolute inset-0 bg-gradient-to-l from-blue-500/20 to-transparent" />
                  {/* Abstract Lock Visual */}
                  <div className="absolute bottom-10 right-10 w-32 h-32 border-4 border-blue-500/30 rounded-full flex items-center justify-center">
                    <div className="w-16 h-16 bg-blue-500/50 rounded-lg" />
                  </div>
                </div>
              </BentoCard>

              {/* Card 2: Reputation */}
              <BentoCard className="min-h-[400px] flex flex-col justify-between bg-gradient-to-b from-[#111] to-[#0a0a0a]">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">Proof of Work</h3>
                  <p className="text-gray-400 text-lg">
                    Your commits are minted as Soulbound NFTs. Build your on-chain resume that travels with you forever.
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-xs text-purple-300">
                    Top 1% Solver
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
                    50+ Bounties
                  </div>
                </div>
              </BentoCard>

              {/* Card 3: Instant Payouts */}
              <BentoCard className="min-h-[300px] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center mb-6 text-yellow-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">Instant Payday</h3>
                  <p className="text-gray-400">
                    No "Net-30". No chasing invoices. Payments execute atomically the second your work is accepted.
                  </p>
                </div>
              </BentoCard>

              {/* Card 4: Multi-Chain */}
              <BentoCard className="md:col-span-2 min-h-[300px] flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-6 text-green-400">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">Build Anywhere</h3>
                  <p className="text-gray-400 text-lg">
                    Native on Arbitrum and Base. Low fees, high speed, and the best developer communities in crypto.
                  </p>
                </div>
                <div className="flex-1 w-full grid grid-cols-2 gap-4 opacity-50">
                  <div className="h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono text-sm">BASE</div>
                  <div className="h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono text-sm">ARBITRUM</div>
                  <div className="h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono text-sm">OPTIMISM</div>
                  <div className="h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono text-sm">MANTLE</div>
                </div>
              </BentoCard>
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="py-20 border-y border-white/5 bg-black">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              {[
                { label: "Total Value Locked", value: "$1.2M+" },
                { label: "Bounties Completed", value: "450+" },
                { label: "Active Solvers", value: "2.5k" },
                { label: "Avg. Payout Time", value: "< 1hr" },
              ].map((stat, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">{stat.value}</div>
                  <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-32 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />

          <div className="max-w-3xl mx-auto relative z-10">
            <FadeIn>
              <h2 className="text-5xl md:text-7xl font-semibold tracking-tighter mb-8">
                Stop Waiting.<br />
                Start Bouncing.
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
                Join thousands of builders and influencers getting paid instantly for their work.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-10 py-4 bg-white text-black rounded-full text-lg font-bold hover:bg-gray-200 transition-colors w-full sm:w-auto"
                >
                  Launch App
                </button>
                <button className="px-10 py-4 bg-black border border-white/20 text-white rounded-full text-lg font-bold hover:bg-white/10 transition-colors w-full sm:w-auto">
                  View Docs
                </button>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
