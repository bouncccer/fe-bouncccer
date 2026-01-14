"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useChainId } from "wagmi";
import { BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";

const WalletComponents = dynamic(
  () => import("./WalletComponents"),
  { ssr: false }
);

const navItems = [
  { name: "Bounties", link: "/bounties" },
  { name: "Reputation", link: "/reputation" },
  { name: "History", link: "/history" },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const chainId = useChainId();
  const isBase = chainId === BASE_SEPOLIA_CHAIN_ID;
  const networkName = isBase ? "Base" : "Arbitrum";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
              Bouncccer
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.link}
                href={item.link}
                className={`
                  text-sm font-medium transition-colors duration-200
                  ${isActive(item.link)
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                  }
                `}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Network Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-400">
                {networkName}
              </span>
            </div>

            {/* Wallet */}
            {isMounted && <WalletComponents />}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-3/4 max-w-sm bg-[#0A0A0A] border-l border-white/10 p-6 shadow-2xl"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <span className="font-bold text-xl text-white">Menu</span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <nav className="space-y-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.link}
                      href={item.link}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        block text-lg font-medium transition-colors
                        ${isActive(item.link)
                          ? "text-blue-400"
                          : "text-gray-400 hover:text-white"
                        }
                      `}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>

                <div className="mt-auto space-y-6">
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-sm text-gray-400">Network</span>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium text-white">{networkName}</span>
                    </div>
                  </div>

                  {isMounted && <WalletComponents />}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
