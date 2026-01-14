"use client";

import Link from "next/link";
import { X, Github, ArrowUpRight, Code2, Shield, Zap } from "lucide-react";
import { useChainId } from "wagmi";
import { CONTRACT_ADDRESSES, MANTLE_SEPOLIA_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID, EXPLORERS } from "../utils/contracts";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const chainId = useChainId();
  const isBase = chainId === BASE_SEPOLIA_CHAIN_ID;
  const networkName = isBase ? "Base Sepolia" : "Arbitrum Sepolia";
  const networkLabel = isBase ? "Base" : "Arbitrum";
  const explorerUrl = EXPLORERS[chainId] || EXPLORERS[MANTLE_SEPOLIA_CHAIN_ID];

  return (
    <footer className="relative z-20 bg-black border-t border-white/5 py-20">
      <div className="max-w-7xl mx-auto px-6">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="font-bold text-xl text-white">Bouncccer</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              The trustless bounty platform for the decentralized future.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://x.com/Bouncccer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/Bouncccer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="font-semibold text-white mb-6">Platform</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/bounties" className="hover:text-white transition-colors">Browse Bounties</Link></li>
              <li><Link href="/reputation" className="hover:text-white transition-colors">Reputation</Link></li>
              <li><Link href="/history" className="hover:text-white transition-colors">History</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-6">Resources</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li>
                <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                  Documentation <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                  Explorer <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-6">Network</h3>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-300">
                {networkName}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <div>
            &copy; {currentYear} Bouncccer Labs. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
