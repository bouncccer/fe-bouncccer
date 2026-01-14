"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId } from "wagmi";
import { readContract } from "@wagmi/core";
import {
    CONTRACT_ADDRESSES,
    QUINTY_ABI,
    ARBITRUM_SEPOLIA_CHAIN_ID,
} from "../../utils/contracts";
import { formatETH, wagmiConfig } from "../../utils/web3";
import { useIndexerUserHistory } from "../../hooks/useIndexer";
import {
    Target,
    Calendar,
    Coins,
    ExternalLink,
    Clock,
    Loader2,
    Trophy,
    History as HistoryIcon,
    ArrowUpRight
} from "lucide-react";

interface Transaction {
    id: string;
    type: "bounty_created" | "bounty_submitted" | "bounty_won" | "bounty_revealed" | "bounty_replied";
    itemId: number;
    amount?: bigint;
    timestamp: bigint;
    status: string;
    description: string;
}

export default function HistoryPage() {
    const router = useRouter();
    const { address } = useAccount();
    const chainId = useChainId();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (address) {
            loadTransactionHistory();
        }
    }, [address, chainId]);

    const { data: historyData, isLoading: isIndexerLoading } = useIndexerUserHistory(address || "");

    const [isFallbackLoading, setIsFallbackLoading] = useState(false);

    useEffect(() => {
        const loadFallback = async () => {
            if (address && !isIndexerLoading && historyData?.bounties.length === 0 && historyData?.submissions.length === 0 && !isFallbackLoading) {
                setIsFallbackLoading(true);
                try {
                    const counter = await readContract(wagmiConfig, {
                        address: CONTRACT_ADDRESSES[chainId]?.Quinty as `0x${string}`,
                        abi: QUINTY_ABI,
                        functionName: "bountyCounter",
                    });

                    const userTransactions: Transaction[] = [];
                    for (let i = 1; i <= Number(counter); i++) {
                        const data = await readContract(wagmiConfig, {
                            address: CONTRACT_ADDRESSES[chainId]?.Quinty as `0x${string}`,
                            abi: QUINTY_ABI,
                            functionName: "getBountyData",
                            args: [BigInt(i)],
                        });
                        if (data) {
                            const d = data as any[];
                            const creator = d[0];
                            if (creator.toLowerCase() === address.toLowerCase()) {
                                userTransactions.push({
                                    id: `fallback-created-${i}`,
                                    type: "bounty_created",
                                    itemId: i,
                                    amount: d[2],
                                    timestamp: BigInt(Math.floor(Date.now() / 1000)), // Fallback timestamp
                                    status: Number(d[6]) === 1 ? "Open" : "Resolved",
                                    description: d[1].split("\n")[0],
                                });
                            }
                        }
                    }
                    setTransactions(userTransactions);
                } catch (e) {
                    console.error("History fallback error:", e);
                } finally {
                    setIsFallbackLoading(false);
                }
            }
        };
        loadFallback();
    }, [address, historyData, isIndexerLoading, chainId]);

    useEffect(() => {
        if (address && historyData && (historyData.bounties.length > 0 || historyData.submissions.length > 0)) {
            const allTransactions: Transaction[] = [];

            // Add bounties created
            historyData.bounties.forEach((b: any) => {
                allTransactions.push({
                    id: `bounty-created-${b.id}`,
                    type: "bounty_created",
                    itemId: parseInt(b.id.split("-").pop()),
                    amount: BigInt(b.amount),
                    timestamp: BigInt(b.timestamp),
                    status: b.status,
                    description: b.title || b.description.split("\n")[0] || `Bounty #${b.id}`,
                });
            });

            // Add submissions
            historyData.submissions.forEach((s: any) => {
                const bountyId = parseInt(s.bountyId.split("-").pop());

                allTransactions.push({
                    id: `bounty-submitted-${s.id}`,
                    type: "bounty_submitted",
                    itemId: bountyId,
                    amount: 0n, // Deposit info not in event currently
                    timestamp: BigInt(s.timestamp),
                    status: s.isRevealed ? "Revealed" : "Submitted",
                    description: s.bounty?.title || s.bounty?.description?.split("\n")[0] || `Bounty #${bountyId}`,
                });

                if (s.isWinner) {
                    allTransactions.push({
                        id: `bounty-won-${s.id}`,
                        type: "bounty_won",
                        itemId: bountyId,
                        amount: BigInt(s.bounty?.amount || 0),
                        timestamp: BigInt(s.timestamp),
                        status: "Won",
                        description: s.bounty?.title || s.bounty?.description?.split("\n")[0] || `Bounty #${bountyId}`,
                    });
                }
            });

            allTransactions.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
            setTransactions(allTransactions);
            setIsLoading(false);
        } else if (!isIndexerLoading && !isFallbackLoading) {
            setIsLoading(false);
        }
    }, [address, historyData, isIndexerLoading, isFallbackLoading]);

    const loadTransactionHistory = async () => {
        // Kept for compatibility or fallback, but primarily using the useEffect above
    };

    const getTransactionColor = (type: Transaction["type"]) => {
        if (type.includes("created")) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        if (type.includes("submitted")) return "bg-purple-500/10 text-purple-500 border-purple-500/20";
        if (type.includes("won")) return "bg-green-500/10 text-green-500 border-green-500/20";
        if (type.includes("revealed")) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        if (type.includes("replied")) return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    };

    const getTransactionLabel = (type: Transaction["type"]) => {
        const labels: Record<Transaction["type"], string> = {
            bounty_created: "Created Bounty",
            bounty_submitted: "Submitted to Bounty",
            bounty_won: "Won Bounty",
            bounty_revealed: "Revealed Solution",
            bounty_replied: "Replied to Submission",
        };
        return labels[type];
    };

    if (!address) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px]" />
                </div>
                <div className="text-center max-w-md relative z-10 p-8 rounded-3xl bg-[#111] border border-white/5">
                    <div className="w-16 h-16 mx-auto mb-6 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                        <Clock className="w-8 h-8 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Connect Wallet</h2>
                    <p className="text-gray-400">
                        Please connect your wallet to view your transaction history.
                    </p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
                    <p className="text-gray-400">Loading history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] opacity-30" />
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 relative z-10">
                {/* Page Header */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-400 mb-6">
                        <HistoryIcon className="w-3 h-3" />
                        <span>Activity Log</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        History
                    </h1>
                    <p className="text-lg text-gray-400 leading-relaxed">
                        Track all your interactions, bounties, and earnings on the platform.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    {/* Total Transactions */}
                    <div className="p-6 rounded-2xl bg-[#111] border border-white/5">
                        <div className="flex items-center gap-2 mb-4 text-gray-400">
                            <Target className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Total Transactions</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{transactions.length}</p>
                    </div>

                    {/* Bounties Won */}
                    <div className="p-6 rounded-2xl bg-[#111] border border-white/5">
                        <div className="flex items-center gap-2 mb-4 text-green-400">
                            <Trophy className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Bounties Won</span>
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {transactions.filter((tx) => tx.type === "bounty_won").length}
                        </p>
                    </div>

                    {/* Bounties Created */}
                    <div className="p-6 rounded-2xl bg-[#111] border border-white/5">
                        <div className="flex items-center gap-2 mb-4 text-blue-400">
                            <Target className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Bounties Created</span>
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {transactions.filter((tx) => tx.type === "bounty_created").length}
                        </p>
                    </div>
                </div>

                {transactions.length === 0 ? (
                    <div className="text-center py-20 rounded-3xl border border-dashed border-white/10 bg-white/5">
                        <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
                            <Clock className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Activity Yet</h3>
                        <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                            You haven't participated in any bounties yet. Start exploring to earn rewards.
                        </p>
                        <button
                            onClick={() => router.push("/bounties")}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-all inline-flex items-center gap-2"
                        >
                            Explore Bounties <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((tx) => {
                            const colorClass = getTransactionColor(tx.type);

                            return (
                                <div
                                    key={tx.id}
                                    onClick={() => router.push(`/bounties/${tx.itemId}`)}
                                    className="group p-4 rounded-xl bg-[#111] border border-white/5 hover:border-white/10 hover:bg-[#161616] transition-all cursor-pointer flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        {/* Icon Box */}
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClass}`}>
                                            <Target className="h-5 w-5" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-sm text-white truncate">
                                                    {getTransactionLabel(tx.type)}
                                                </h3>
                                                <div className={`px-2 py-0.5 rounded text-[10px] font-medium border ${colorClass}`}>
                                                    {tx.status}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 truncate">
                                                {tx.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-xs text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {new Date(Number(tx.timestamp) * 1000).toLocaleDateString()}
                                        </div>
                                        {tx.amount && (
                                            <div className="flex items-center gap-1.5 text-gray-300">
                                                <Coins className="h-3.5 w-3.5" />
                                                {formatETH(tx.amount)} ETH
                                            </div>
                                        )}
                                        <ArrowUpRight className="h-4 w-4 text-gray-600 group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
