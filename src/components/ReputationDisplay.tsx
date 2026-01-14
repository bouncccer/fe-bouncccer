"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useReadContract, useWatchContractEvent, useChainId } from "wagmi";
import {
  CONTRACT_ADDRESSES,
  REPUTATION_ABI,
  QUINTY_ABI,
  BASE_SEPOLIA_CHAIN_ID,
} from "../utils/contracts";
import { readContract } from "@wagmi/core";
import { formatAddress, wagmiConfig, formatETH } from "../utils/web3";
import { isAddress } from "viem";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Trophy,
  Target,
  User,
  Search,
  TrendingUp,
  Medal,
  Award,
  Star,
  Zap
} from "lucide-react";

interface UserStatsData {
  bountiesCreated: number;
  submissions: number;
  wins: number;
}

interface UserAchievements {
  achievements: number[];
  tokenIds: number[];
}

interface UserProfile {
  address: string;
  stats: UserStatsData;
  achievements: UserAchievements;
}

const ACHIEVEMENT_MILESTONES = [1, 10, 50];

export default function ReputationDisplay() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [searchAddress, setSearchAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [topCreators, setTopCreators] = useState<any[]>([]);
  const [topSolvers, setTopSolvers] = useState<any[]>([]);

  // Load top users by volume
  useEffect(() => {
    const loadTopUsers = async () => {
      try {
        const bountyCounter = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[chainId].Quinty as `0x${string}`,
          abi: QUINTY_ABI,
          functionName: "bountyCounter",
        });

        const count = Number(bountyCounter);
        const creatorVolume: Record<string, bigint> = {};
        const solverVolume: Record<string, bigint> = {};

        for (let i = 1; i <= count; i++) {
          try {
            const data = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[chainId].Quinty as `0x${string}`,
              abi: QUINTY_ABI,
              functionName: "getBountyData",
              args: [BigInt(i)],
            });
            if (data) {
              const b = data as any[];
              const creator = b[0];
              const amount = b[2] as bigint;
              const status = b[6];
              const winners = b[8] as string[];

              // Aggregate Creator Volume
              creatorVolume[creator] = (creatorVolume[creator] || 0n) + amount;

              // Aggregate Solver Volume (only for resolved bounties)
              if (status === 3 && winners && winners.length > 0) {
                const primaryWinner = winners[0];
                solverVolume[primaryWinner] = (solverVolume[primaryWinner] || 0n) + amount;
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        // Sort and get Top 3 Creators
        const sortedCreators = Object.entries(creatorVolume)
          .map(([address, totalValue]) => ({ address, totalValue }))
          .sort((a, b) => (b.totalValue > a.totalValue ? 1 : -1))
          .slice(0, 3);
        setTopCreators(sortedCreators);

        // Sort and get Top 3 Solvers
        const sortedSolvers = Object.entries(solverVolume)
          .map(([address, totalValue]) => ({ address, totalValue }))
          .sort((a, b) => (b.totalValue > a.totalValue ? 1 : -1))
          .slice(0, 3);
        setTopSolvers(sortedSolvers);

      } catch (error) {
        console.error("Error loading top users:", error);
      }
    };

    loadTopUsers();
  }, [chainId]);

  // Read user stats
  const { data: userStats, refetch: refetchStats } = useReadContract({
    address: CONTRACT_ADDRESSES[chainId]
      .QuintyReputation as `0x${string}`,
    abi: REPUTATION_ABI,
    functionName: "getUserStats",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  // Read user achievements
  const { data: userAchievements, refetch: refetchAchievements } =
    useReadContract({
      address: CONTRACT_ADDRESSES[chainId]
        .QuintyReputation as `0x${string}`,
      abi: REPUTATION_ABI,
      functionName: "getUserAchievements",
      args: address ? [address] : undefined,
      query: { enabled: isConnected && !!address },
    });

  // Watch for achievement updates
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES[chainId]
      .QuintyReputation as `0x${string}`,
    abi: REPUTATION_ABI,
    eventName: "AchievementUnlocked",
    onLogs() {
      refetchStats();
      refetchAchievements();
    },
  });

  // Load user profile data
  useEffect(() => {
    if (address && userStats && userAchievements) {
      const achievementsArray = userAchievements as any[];

      const stats = {
        bountiesCreated: Number((userStats as any)?.totalBountiesCreated || 0),
        submissions: Number((userStats as any)?.totalSubmissions || 0),
        wins: Number((userStats as any)?.totalWins || 0),
      };

      const achievements = {
        achievements: achievementsArray[0]
          ? achievementsArray[0].map((a: any) => Number(a))
          : [],
        tokenIds: achievementsArray[1]
          ? achievementsArray[1].map((t: any) => Number(t))
          : [],
      };

      setUserProfile({
        address,
        stats,
        achievements,
      });
      setLoading(false);
    } else if (!isConnected) {
      setLoading(false);
    }
  }, [address, userStats, userAchievements, isConnected]);

  // Search for another user
  const searchUserProfile = async () => {
    if (!searchAddress.trim() || !isAddress(searchAddress)) {
      alert("Please enter a valid Ethereum address.");
      return;
    }

    try {
      const [statsData, achievementsData] = await Promise.all([
        readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[chainId]
            .QuintyReputation as `0x${string}`,
          abi: REPUTATION_ABI,
          functionName: "getUserStats",
          args: [searchAddress as `0x${string}`],
        }),
        readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[chainId]
            .QuintyReputation as `0x${string}`,
          abi: REPUTATION_ABI,
          functionName: "getUserAchievements",
          args: [searchAddress as `0x${string}`],
        }),
      ]);

      const stats = {
        bountiesCreated: Number((statsData as any)?.totalBountiesCreated || 0),
        submissions: Number((statsData as any)?.totalSubmissions || 0),
        wins: Number((statsData as any)?.totalWins || 0),
      };

      const achievementsArray = achievementsData as any[];
      const achievements = {
        achievements: achievementsArray[0]
          ? achievementsArray[0].map((a: any) => Number(a))
          : [],
        tokenIds: achievementsArray[1]
          ? achievementsArray[1].map((t: any) => Number(t))
          : [],
      };

      const searchedProfile: UserProfile = {
        address: searchAddress,
        stats,
        achievements,
      };

      setLeaderboard((prev) => {
        const filtered = prev.filter(
          (u) => u.address.toLowerCase() !== searchAddress.toLowerCase()
        );
        return [...filtered, searchedProfile].sort(
          (a, b) =>
            b.stats.wins +
            b.stats.bountiesCreated -
            (a.stats.wins + a.stats.bountiesCreated)
        );
      });
      setSearchAddress("");
    } catch (error) {
      console.error("Error searching user:", error);
      alert("Could not find data for the given address.");
    }
  };

  const getProgressToNext = (current: number) => {
    const nextMilestone = ACHIEVEMENT_MILESTONES.find((m) => m > current);
    return nextMilestone ? nextMilestone - current : 0;
  };

  return (
    <div className="space-y-8">
      {/* Quick Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Zap, title: "Participate", desc: "Create bounties or submit solutions" },
          { icon: Star, title: "Hit Milestones", desc: "Reach 1, 10, 50 contributions" },
          { icon: Award, title: "Earn NFTs", desc: "Get soulbound achievement badges" }
        ].map((item, i) => (
          <div key={i} className="p-6 rounded-2xl bg-[#111] border border-white/5 hover:bg-[#161616] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <item.icon className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-sm text-gray-400">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Profile Stats (if connected) */}
      {isConnected && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 rounded-3xl bg-[#111] border border-white/5 text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-500">Loading profile...</p>
            </div>
          ) : userProfile ? (
            <div className="p-6 md:p-8 rounded-3xl bg-[#111] border border-white/5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-xl font-bold text-white">
                      {userProfile.address.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      Your Profile
                    </h2>
                    <p className="text-sm text-gray-400 font-mono bg-white/5 px-2 py-1 rounded-md inline-block">
                      {formatAddress(userProfile.address)}
                    </p>
                  </div>
                </div>
                <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                  {userProfile.achievements.achievements.length} Badges Earned
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Solutions", value: userProfile.stats.submissions, icon: Target },
                  { label: "Wins", value: userProfile.stats.wins, icon: Trophy },
                  { label: "Created", value: userProfile.stats.bountiesCreated, icon: Medal }
                ].map((stat, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 mb-3 text-gray-400">
                      <stat.icon className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">{stat.label}</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-3">
                      {stat.value}
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(stat.value % 10) * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {getProgressToNext(stat.value)} to next milestone
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-[#111] border border-white/5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Profile Not Found</h3>
              <p className="text-gray-400">Could not load user profile data.</p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard & Search */}
      <div className="rounded-3xl bg-[#111] border border-white/5 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-white/5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Leaderboard</h2>
                <p className="text-sm text-gray-400">Top contributors and search</p>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <Input
                placeholder="Search address (0x...)"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUserProfile()}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 min-w-[240px]"
              />
              <Button
                onClick={searchUserProfile}
                disabled={!searchAddress.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Top Creators */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Medal className="w-4 h-4" /> Top Creators
            </h3>
            <div className="space-y-3">
              {topCreators.length === 0 ? (
                <div className="text-sm text-gray-500 italic">No data available</div>
              ) : (
                topCreators.map((creator, i) => (
                  <div key={creator.address} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                        {i + 1}
                      </div>
                      <span className="text-sm font-medium text-white font-mono">
                        {formatAddress(creator.address)}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-blue-400">
                      {formatETH(creator.totalValue)} ETH
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Solvers */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Top Solvers
            </h3>
            <div className="space-y-3">
              {topSolvers.length === 0 ? (
                <div className="text-sm text-gray-500 italic">No data available</div>
              ) : (
                topSolvers.map((solver, i) => (
                  <div key={solver.address} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                        {i + 1}
                      </div>
                      <span className="text-sm font-medium text-white font-mono">
                        {formatAddress(solver.address)}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-green-400">
                      {formatETH(solver.totalValue)} ETH
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Searches */}
        {leaderboard.length > 0 && (
          <div className="p-6 md:p-8 border-t border-white/5">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
              Recent Searches
            </h3>
            <div className="space-y-3">
              {leaderboard.map((user, index) => (
                <div key={user.address} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-mono text-white font-medium">{formatAddress(user.address)}</div>
                      <div className="text-xs text-gray-500">{user.achievements.achievements.length} badges</div>
                    </div>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div>
                      <div className="text-white font-bold">{user.stats.submissions}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Sol</div>
                    </div>
                    <div>
                      <div className="text-white font-bold">{user.stats.wins}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Win</div>
                    </div>
                    <div>
                      <div className="text-white font-bold">{user.stats.bountiesCreated}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Create</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Achievements Table */}
      <div className="rounded-3xl bg-[#111] border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">Achievement Milestones</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                {ACHIEVEMENT_MILESTONES.map((m) => (
                  <th key={m} className="p-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {m} Actions
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { type: "Solver", icon: Target, color: "text-blue-500" },
                { type: "Winner", icon: Trophy, color: "text-yellow-500" },
                { type: "Creator", icon: Medal, color: "text-purple-500" }
              ].map((row, idx) => (
                <tr key={row.type} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white/5 ${row.color}`}>
                        <row.icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-white">{row.type}</span>
                    </div>
                  </td>
                  {ACHIEVEMENT_MILESTONES.map((m, i) => (
                    <td key={m} className="p-4 text-center">
                      <div className="inline-flex w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center">
                        <span className="text-xs font-bold text-gray-400">{i + 1}</span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
