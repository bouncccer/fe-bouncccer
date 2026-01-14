"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChainId } from "wagmi";
import { BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { formatETH, formatTimeLeft, formatAddress } from "../utils/web3";
import { fetchMetadataFromIpfs, BountyMetadata } from "../utils/ipfs";
import { getMockMetadata } from "../utils/mockBounties";
import { getEthPriceInUSD, convertEthToUSD, formatUSD } from "../utils/prices";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Clock, Users, Trophy, Eye, Share2, Target, ArrowRight, X, ExternalLink } from "lucide-react";
import { useShare } from "@/hooks/useShare";

interface Bounty {
  id: number;
  creator: string;
  description: string;
  amount: bigint;
  deadline: bigint;
  allowMultipleWinners: boolean;
  winnerShares: readonly bigint[];
  status: number;
  slashPercent: bigint;
  submissions: readonly any[];
  selectedWinners: readonly string[];
  selectedSubmissionIds: readonly bigint[];
  metadataCid?: string;
}

interface BountyCardProps {
  bounty: Bounty;
  viewMode?: "grid" | "list";
}

const BountyStatusEnum = ["OPREC", "OPEN", "REVEAL", "RESOLVED", "EXPIRED"];

export default function BountyCard({ bounty, viewMode = "grid" }: BountyCardProps) {
  const router = useRouter();
  const chainId = useChainId();
  const isBase = chainId === BASE_SEPOLIA_CHAIN_ID;
  const currencyLabel = isBase ? "ETH" : "ETH"; // Arbitrum uses ETH too
  const [metadata, setMetadata] = useState<BountyMetadata | null>(null);
  const [quickView, setQuickView] = useState(false);
  const { shareLink } = useShare();
  const [ethPrice, setEthPrice] = useState<number>(0);

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getEthPriceInUSD();
      setEthPrice(price);
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadMetadata = async () => {
      if (!bounty.metadataCid) return;
      const mockMeta = getMockMetadata(bounty.metadataCid);
      if (mockMeta) {
        setMetadata(mockMeta);
        return;
      }
      try {
        const meta = await fetchMetadataFromIpfs(bounty.metadataCid);
        setMetadata(meta);
      } catch (error) {
        console.error("Failed to load bounty metadata:", error);
      }
    };
    loadMetadata();
  }, [bounty.metadataCid]);

  const statusLabel = BountyStatusEnum[bounty.status] || "UNKNOWN";

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case 1: return "bg-green-500/10 text-green-500 border-green-500/20";
      case 2: return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case 3: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case 4: return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  if (viewMode === "list") {
    return (
      <div
        onClick={() => router.push(`/bounties/${bounty.id === 999 ? 'example' : bounty.id}`)}
        className="group relative bg-[#111] hover:bg-[#161616] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
      >
        <div className="flex flex-col md:flex-row p-6 gap-6">
          {/* Image/Icon */}
          <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 relative">
            {metadata?.images && metadata.images.length > 0 ? (
              <img
                src={metadata.images[0].startsWith('/') ? metadata.images[0] : `https://ipfs.io/ipfs/${metadata.images[0]}`}
                alt={metadata.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Target className="w-10 h-10 text-white/20" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${getStatusColor(bounty.status)}`}>
                  {statusLabel}
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  #{bounty.id}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 line-clamp-1">
                {metadata?.title || bounty.description.split("\n")[0]}
              </h3>
              <p className="text-sm text-gray-400 line-clamp-2">
                {metadata?.description || "No description available."}
              </p>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-blue-500" />
                  <span className="text-white font-medium">{formatETH(bounty.amount)} {currencyLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{bounty.submissions.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimeLeft(bounty.deadline)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>by {formatAddress(bounty.creator)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => router.push(`/bounties/${bounty.id === 999 ? 'example' : bounty.id}`)}
        className="group relative bg-[#111] hover:bg-[#161616] border border-white/5 rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer flex flex-col h-full"
      >
        {/* Image Section */}
        <div className="relative h-48 bg-white/5 overflow-hidden">
          {metadata?.images && metadata.images.length > 0 ? (
            <img
              src={metadata.images[0].startsWith('/') ? metadata.images[0] : `https://ipfs.io/ipfs/${metadata.images[0]}`}
              alt={metadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Target className="w-12 h-12 text-white/20" />
            </div>
          )}

          <div className="absolute top-4 right-4 z-10">
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md ${getStatusColor(bounty.status)}`}>
              {statusLabel}
            </div>
          </div>

          {/* Hover Actions - Redesigned */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6 z-20">
            <div className="flex items-center gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickView(true);
                }}
                className="h-9 px-4 rounded-full bg-white/10 hover:bg-white text-white hover:text-black backdrop-blur-md border border-white/20 transition-all"
              >
                <Eye className="w-4 h-4 mr-2" />
                Quick View
              </Button>
              <Button
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  shareLink(`/bounties/${bounty.id === 999 ? 'example' : bounty.id}`, "Share");
                }}
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white text-white hover:text-black backdrop-blur-md border border-white/20 transition-all"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          <div className="mb-4 flex-1">
            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
              {metadata?.title || bounty.description.split("\n")[0]}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-2">
              {metadata?.description || "No description available."}
            </p>
          </div>

          <div className="space-y-4">
            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>{bounty.submissions.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimeLeft(bounty.deadline)}</span>
                </div>
              </div>
              <div>#{bounty.id}</div>
            </div>

            {/* Reward Bar */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between group-hover:border-blue-500/40 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    {formatETH(bounty.amount)} {currencyLabel}
                  </div>
                  {ethPrice > 0 && (
                    <div className="text-[10px] text-blue-300">
                      {formatUSD(convertEthToUSD(Number(bounty.amount) / 1e18, ethPrice))}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400">
                {bounty.creator.slice(2, 4).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick View Dialog */}
      <Dialog open={quickView} onOpenChange={setQuickView}>
        <DialogContent className="max-w-2xl bg-[#111] border border-white/10 text-white p-0 overflow-hidden shadow-2xl sm:rounded-3xl">
          <div className="relative h-64 bg-[#0a0a0a]">
            {metadata?.images && metadata.images.length > 0 ? (
              <>
                <img
                  src={metadata.images[0].startsWith('/') ? metadata.images[0] : `https://ipfs.io/ipfs/${metadata.images[0]}`}
                  alt={metadata.title}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/50 to-transparent" />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/10 to-purple-900/10">
                <Target className="w-16 h-16 text-white/10" />
              </div>
            )}

            <button
              onClick={() => setQuickView(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-colors border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border backdrop-blur-md ${getStatusColor(bounty.status)}`}>
                  {statusLabel}
                </span>
                <span className="text-xs font-medium text-gray-400 bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/5">
                  #{bounty.id}
                </span>
              </div>
              <DialogTitle className="text-3xl font-bold text-white leading-tight">
                {metadata?.title || bounty.description.split("\n")[0]}
              </DialogTitle>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                  <Trophy className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Reward</div>
                <div className="text-xl font-bold text-white">{formatETH(bounty.amount)} {currencyLabel}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Submissions</div>
                <div className="text-xl font-bold text-white">{bounty.submissions.length}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Time Left</div>
                <div className="text-xl font-bold text-white">{formatTimeLeft(bounty.deadline)}</div>
              </div>
            </div>

            {metadata?.description && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                  Description
                </h4>
                <div className="text-sm text-gray-400 leading-relaxed max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                  {metadata.description}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-white/5">
              <Button
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 text-base font-medium"
                onClick={() => {
                  setQuickView(false);
                  router.push(`/bounties/${bounty.id === 999 ? 'example' : bounty.id}`);
                }}
              >
                View Full Details <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
