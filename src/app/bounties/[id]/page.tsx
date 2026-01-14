"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { readContract } from "@wagmi/core";
import {
  CONTRACT_ADDRESSES,
  QUINTY_ABI,
  BASE_SEPOLIA_CHAIN_ID,
} from "../../../utils/contracts";
import {
  formatETH,
  formatAddress,
  wagmiConfig,
} from "../../../utils/web3";
import { fetchMetadataFromIpfs, BountyMetadata, uploadToIpfs } from "../../../utils/ipfs";
import { getMockMetadata, getExampleBounty } from "../../../utils/mockBounties";
import { useAlert } from "../../../hooks/useAlert";
import { getEthPriceInUSD, convertEthToUSD, formatUSD } from "../../../utils/prices";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  ChevronLeft,
  Clock,
  Users,
  Trophy,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  Target,
  Shield,
  Upload,
  Share2,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Reply {
  replier: string;
  content: string;
  timestamp: bigint;
}

interface Submission {
  solver: string;
  blindedIpfsCid: string;
  revealIpfsCid: string;
  deposit: bigint;
  replies: readonly Reply[];
  revealed: boolean;
}

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
  submissions: readonly Submission[];
  selectedWinners: readonly string[];
  selectedSubmissionIds: readonly bigint[];
  metadataCid?: string;
  hasOprec?: boolean;
  oprecDeadline?: bigint;
}

const BountyStatusEnum = ["Open Rec", "Open", "Pending Reveal", "Resolved", "Expired"];

export default function BountyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const chainId = useChainId();
  const isBase = chainId === BASE_SEPOLIA_CHAIN_ID;
  const currencyLabel = isBase ? "ETH" : "ETH"; // Arbitrum uses ETH
  const { showAlert } = useAlert();
  const bountyId = params.id as string;

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [metadata, setMetadata] = useState<BountyMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submissionCid, setSubmissionCid] = useState("");
  const [uploadedSolutionImage, setUploadedSolutionImage] = useState<File | null>(null);
  const [isUploadingSolution, setIsUploadingSolution] = useState(false);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Load bounty data
  const loadBounty = async () => {
    try {
      setIsLoading(true);

      if (bountyId === "example") {
        const exampleBounty = getExampleBounty();
        setBounty(exampleBounty);
        if (exampleBounty.metadataCid) {
          const mockMeta = getMockMetadata(exampleBounty.metadataCid);
          if (mockMeta) setMetadata(mockMeta);
        }
        setIsLoading(false);
        return;
      }

      const bountyData = await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESSES[chainId].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "getBountyData",
        args: [BigInt(bountyId)],
      });

      if (bountyData) {
        const b = bountyData as any[];
        const submissionCount = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[chainId].Quinty as `0x${string}`,
          abi: QUINTY_ABI,
          functionName: "getSubmissionCount",
          args: [BigInt(bountyId)],
        });

        const submissions: Submission[] = [];
        for (let i = 0; i < Number(submissionCount); i++) {
          const sData = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[chainId].Quinty as `0x${string}`,
            abi: QUINTY_ABI,
            functionName: "getSubmissionStruct",
            args: [BigInt(bountyId), BigInt(i)],
          });
          if (sData) submissions.push(sData as unknown as Submission);
        }

        const metadataMatch = b[1].match(/Metadata: ipfs:\/\/([a-zA-Z0-9]+)/);
        const metadataCid = metadataMatch ? metadataMatch[1] : undefined;

        setBounty({
          id: parseInt(bountyId),
          creator: b[0],
          description: b[1],
          amount: b[2],
          deadline: b[3],
          allowMultipleWinners: b[4],
          winnerShares: b[5],
          status: b[6],
          slashPercent: b[7],
          submissions,
          selectedWinners: b[8],
          selectedSubmissionIds: b[9],
          metadataCid,
          hasOprec: b[10],
          oprecDeadline: b[11],
        });

        if (metadataCid) {
          const mockMeta = getMockMetadata(metadataCid);
          if (mockMeta) {
            setMetadata(mockMeta);
          } else {
            try {
              const meta = await fetchMetadataFromIpfs(metadataCid);
              setMetadata(meta);
            } catch (error) {
              console.error("Failed to load metadata:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading bounty:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (bountyId) loadBounty();
  }, [bountyId]);

  useEffect(() => {
    if (isConfirmed) loadBounty();
  }, [isConfirmed]);

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getEthPriceInUSD();
      setEthPrice(price);
    };
    fetchPrice();
  }, []);

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitSolution = async () => {
    if (!bounty || (!uploadedSolutionImage && !submissionCid.trim())) {
      showAlert({ title: "Missing Information", description: "Please upload a solution image or enter an IPFS CID" });
      return;
    }

    const depositAmount = bounty.amount / BigInt(10);

    try {
      let solutionCid = submissionCid;
      if (uploadedSolutionImage) {
        setIsUploadingSolution(true);
        try {
          solutionCid = await uploadToIpfs(uploadedSolutionImage, {
            bountyId: bountyId,
            type: "bounty-solution",
          });
        } finally {
          setIsUploadingSolution(false);
        }
      }

      writeContract({
        address: CONTRACT_ADDRESSES[chainId].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "submitSolution",
        args: [BigInt(bountyId), solutionCid],
        value: depositAmount,
      });
      setSubmissionCid("");
      setUploadedSolutionImage(null);
    } catch (error) {
      console.error("Error submitting solution:", error);
      showAlert({ title: "Submission Failed", description: "Failed to submit solution." });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Bounty not found</h2>
          <Button onClick={() => router.push("/bounties")} variant="outline">Back to Bounties</Button>
        </div>
      </div>
    );
  }

  const statusLabel = BountyStatusEnum[bounty.status] || "Unknown";
  const timeLeft = Number(bounty.deadline) - currentTime;
  const isExpired = timeLeft <= 0;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Background Glow */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 relative z-10">
        {/* Navigation */}
        <button
          onClick={() => router.push("/bounties")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10">
            <ChevronLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back to Bounties</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className={`border-white/10 bg-white/5 text-white capitalize`}>
                  {metadata?.bountyType || "Development"}
                </Badge>
                <Badge variant="outline" className={`border-white/10 ${bounty.status === 1 ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                  {statusLabel}
                </Badge>
                <span className="text-sm text-gray-500">#{bounty.id}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                {metadata?.title || bounty.description.split("\n")[0]}
              </h1>

              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                    {bounty.creator.slice(2, 4).toUpperCase()}
                  </div>
                  <span>by {formatAddress(bounty.creator)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{isExpired ? "Expired" : `${Math.floor(timeLeft / 86400)}d ${Math.floor((timeLeft % 86400) / 3600)}h left`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{bounty.submissions.length} submissions</span>
                </div>
              </div>
            </div>

            {/* Image */}
            {metadata?.images && metadata.images.length > 0 && (
              <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#111]">
                <img
                  src={metadata.images[0].startsWith('/') ? metadata.images[0] : `https://ipfs.io/ipfs/${metadata.images[0]}`}
                  alt={metadata.title}
                  className="w-full h-auto object-cover max-h-[400px]"
                />
              </div>
            )}

            {/* Description */}
            <div className="p-8 rounded-3xl bg-[#111] border border-white/5">
              <h3 className="text-xl font-bold text-white mb-4">Description</h3>
              <div className="prose prose-invert max-w-none text-gray-400">
                <p className="whitespace-pre-wrap">{metadata?.description || bounty.description}</p>
              </div>

              {metadata?.requirements && metadata.requirements.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-white mb-3">Requirements</h4>
                  <ul className="space-y-2">
                    {metadata.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-400">
                        <Check className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Submissions */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Submissions ({bounty.submissions.length})</h3>
              {bounty.submissions.length === 0 ? (
                <div className="p-8 rounded-3xl bg-[#111] border border-white/5 text-center">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-gray-500" />
                  </div>
                  <p className="text-gray-400">No submissions yet. Be the first to solve this!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {bounty.submissions.map((sub, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-[#111] border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-medium text-white">{formatAddress(sub.solver)}</div>
                          <div className="text-xs text-gray-500">Submitted solution</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-white/10 text-gray-400">
                        {sub.revealed ? "Revealed" : "Encrypted"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Reward Card */}
            <div className="p-6 rounded-3xl bg-[#111] border border-white/5 sticky top-24">
              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-1">Total Reward</div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-white">{formatETH(bounty.amount)}</span>
                  <span className="text-xl font-medium text-gray-500 mb-1.5">{currencyLabel}</span>
                </div>
                {ethPrice > 0 && (
                  <div className="text-sm text-blue-400 mt-1">
                    {formatUSD(convertEthToUSD(Number(bounty.amount) / 1e18, ethPrice))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-lg shadow-lg shadow-blue-500/20"
                  disabled={isExpired || bounty.status !== 1}
                >
                  {isExpired ? "Bounty Expired" : "Submit Solution"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-12 border-white/10 hover:bg-white/70 text-black bg-white/90 rounded-xl"
                  onClick={copyLink}
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                  {copied ? "Copied Link" : "Share Bounty"}
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Deposit Required</span>
                  <span className="text-white">10%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Network</span>
                  <span className="text-white">Arbitrum Sepolia</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Contract</span>
                  <a
                    href={`https://sepolia.arbiscan.io/address/${CONTRACT_ADDRESSES[chainId]?.Quinty}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
