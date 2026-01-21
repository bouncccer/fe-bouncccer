"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Target, ChevronLeft, ChevronsLeft, Search } from "lucide-react";
import { useChainId } from "wagmi";
import { readContract } from "@wagmi/core";
import { useQuery } from "@tanstack/react-query";
import { CONTRACT_ADDRESSES, QUINTY_ABI, BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { mockBounties, getMockMetadata, getExampleBounty } from "../utils/mockBounties";
import { formatETH, wagmiConfig } from "../utils/web3";
// INDEXER DISABLED - import { useIndexerBounties } from "../hooks/useIndexer";

interface BountySidebarProps {
  currentBountyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BountySidebar({ currentBountyId, isOpen, onClose }: BountySidebarProps) {
  const router = useRouter();
  const chainId = useChainId();
  const isBase = chainId === BASE_SEPOLIA_CHAIN_ID;
  const currencyLabel = isBase ? "ETH" : "ETH";

  // INDEXER DISABLED - Using on-chain data only
  const [bounties, setBounties] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load on-chain data directly
  React.useEffect(() => {
    const loadOnChainData = async () => {
      setIsLoading(true);
      try {
        const counter = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[chainId]?.Quinty as `0x${string}`,
          abi: QUINTY_ABI,
          functionName: "bountyCounter",
        });

        const loaded = [];
        for (let i = 1; i <= Number(counter); i++) {
          const data = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[chainId]?.Quinty as `0x${string}`,
            abi: QUINTY_ABI,
            functionName: "getBountyData",
            args: [BigInt(i)],
          });
          if (data) {
            const d = data as any[];
            loaded.push({
              id: i,
              description: d[1],
              amount: d[2],
              status: Number(d[6]),
              title: d[1].split("\n")[0],
            });
          }
        }
        setBounties(loaded);
      } catch (e) {
        console.error("Sidebar on-chain load error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadOnChainData();
  }, [chainId]);

  // Map data to the format expected by the sidebar
  const realBounties = React.useMemo(() => {
    const loadedBounties = [];

    // Always add the example bounty first
    loadedBounties.push(getExampleBounty());

    bounties.forEach((b: any) => {
      loadedBounties.push({
        id: b.id,
        description: b.description,
        amount: BigInt(b.amount),
        status: b.status,
        title: b.title || b.description?.split("\n")[0],
        metadataCid: b.description,
        submissions: { length: 0 },
      });
    });

    // Sort by ID descending (newest first)
    return loadedBounties.sort((a, b) => b.id - a.id);
  }, [bounties]);

  return (
    <>
      {/* Sidebar Container - Fixed Position */}
      <div
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] ${isOpen ? "w-80" : "w-0"
          } transition-all duration-300 border-r border-white/5 bg-black overflow-hidden flex-shrink-0 z-30`}
      >
        <div className="h-full overflow-y-auto custom-scrollbar">
          {/* Sidebar Header - Sticky */}
          <div className="p-4 border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm text-white tracking-wide">All Bounties</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                title="Minimize sidebar"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 font-medium uppercase tracking-wider">
              <span>{realBounties.length} Items</span>
              <span>Newest First</span>
            </div>
          </div>

          {/* Bounty List */}
          <div className="p-2 space-y-1">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs text-gray-500">Loading...</span>
              </div>
            ) : realBounties.map((b) => {
              const bMetadata = getMockMetadata(b.metadataCid || "");
              const isExample = b.id === 999;
              const bountyUrlId = isExample ? "example" : b.id.toString();
              const isActive = currentBountyId === bountyUrlId;

              return (
                <button
                  key={b.id}
                  onClick={() => {
                    router.push(`/bounties/${bountyUrlId}`);
                    // Close sidebar on mobile after navigation
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all group ${isActive
                    ? "bg-blue-600/10 border border-blue-500/20"
                    : "hover:bg-white/5 border border-transparent"
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${b.status === 1
                        ? "bg-green-500/20 text-green-500"
                        : b.status === 0
                          ? "bg-blue-500/20 text-blue-500"
                          : "bg-gray-500/20 text-gray-500"
                        }`}
                    >
                      <Target className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xs font-medium mb-0.5 truncate ${isActive ? 'text-blue-400' : 'text-gray-300 group-hover:text-white'}`}>
                        {bMetadata?.title || b.description?.split("\n")[0] || `Bounty #${b.id}`}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span className="font-medium text-gray-400">{formatETH(b.amount)} {currencyLabel}</span>
                        {!isExample && (
                          <>
                            <span>•</span>
                            <span>#{b.id}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden top-16"
          onClick={onClose}
        />
      )}
    </>
  );
}
