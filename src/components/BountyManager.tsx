"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWatchContractEvent,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { readContract } from "@wagmi/core";
import {
  CONTRACT_ADDRESSES,
  QUINTY_ABI,
  ARBITRUM_SEPOLIA_CHAIN_ID,
} from "../utils/contracts";
import { parseETH, wagmiConfig } from "../utils/web3";
import BountyCard from "./BountyCard";
import { uploadMetadataToIpfs, uploadToIpfs, BountyMetadata } from "../utils/ipfs";
// INDEXER DISABLED - import { useIndexerBounties } from "../hooks/useIndexer";
import { mockBounties } from "../utils/mockBounties";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Plus,
  Minus,
  X,
  Target,
  Upload,
  Calendar as CalendarIcon,
  Clock,
  Filter,
  LayoutGrid,
  List as ListIcon,
  ChevronRight,
  Users,
  Trophy
} from "lucide-react";
import { Textarea } from "./ui/textarea";

// Interfaces matching contract structs
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

export default function BountyManager() {
  const { isConnected, address } = useAccount();
  const walletChainId = useChainId();
  // Default to Arbitrum Sepolia if not connected or if connected to an unsupported chain
  const chainId = isConnected && CONTRACT_ADDRESSES[walletChainId]
    ? walletChainId
    : ARBITRUM_SEPOLIA_CHAIN_ID;

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // State
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMyBounties, setShowMyBounties] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Math.floor(Date.now() / 1000));
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Form states
  const [newBounty, setNewBounty] = useState({
    title: "",
    description: "",
    amount: "",
    deadline: "",
    slashPercent: 30,
    allowMultipleWinners: false,
    winnerShares: [100],
    bountyType: "development" as "development" | "design" | "marketing" | "research" | "other",
    requirements: [""],
    deliverables: [""],
    skills: [""],
    images: [] as string[],
    hasOprec: false,
    oprecDeadline: "",
  });

  const [deadlineDate, setDeadlineDate] = useState<Date>();
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Sync date and time to deadline field
  useEffect(() => {
    if (deadlineDate && deadlineTime) {
      const [hours, minutes] = deadlineTime.split(":");
      const combinedDateTime = new Date(deadlineDate);
      combinedDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      const formattedDateTime = combinedDateTime.toISOString().slice(0, 16);
      setNewBounty((prev) => ({ ...prev, deadline: formattedDateTime }));
    }
  }, [deadlineDate, deadlineTime]);

  // Read bounty counter
  const { data: bountyCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[chainId].Quinty as `0x${string}`,
    abi: QUINTY_ABI,
    functionName: "bountyCounter",
    chainId,
    query: { enabled: true, retry: false, refetchOnWindowFocus: false },
  });

  // INDEXER DISABLED - Using on-chain data only
  // const { data: indexerBounties, isLoading: isIndexerLoading, isError: isIndexerError } = useIndexerBounties();
  const hasLoadedRef = useRef(false);

  // Load on-chain data directly
  useEffect(() => {
    if (bountyCounter && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadBountiesAndSubmissions();
    }
  }, [bountyCounter]);

  // Watch for events
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES[chainId].Quinty as `0x${string}`,
    abi: QUINTY_ABI,
    eventName: "BountyCreated",
    onLogs() { loadBountiesAndSubmissions(); },
  });

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Remove image from upload list
  const removeImage = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (newFiles.length > 0) {
        setUploadedFiles((prev) => [...prev, ...newFiles]);
      }
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    if (uploadedFiles.length === 0) return [];
    setIsUploadingImages(true);
    const uploadedCids: string[] = [];
    try {
      for (const file of uploadedFiles) {
        const cid = await uploadToIpfs(file, {
          bountyTitle: newBounty.title,
          type: "bounty-image",
        });
        uploadedCids.push(cid);
      }
      return uploadedCids;
    } catch (error) {
      console.error("Error uploading images:", error);
      throw new Error("Failed to upload images to IPFS");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const loadBountiesAndSubmissions = async () => {
    if (!bountyCounter) return;
    try {
      const bountyIds = Array.from({ length: Number(bountyCounter) }, (_, i) => i + 1);
      const loadedBounties: Bounty[] = [];
      for (const id of bountyIds) {
        try {
          const bountyData = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[chainId].Quinty as `0x${string}`,
            abi: QUINTY_ABI,
            functionName: "getBountyData",
            args: [BigInt(id)],
            chainId: chainId as any,
          });

          if (bountyData) {
            const b = bountyData as any[];
            const submissionCount = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[chainId].Quinty as `0x${string}`,
              abi: QUINTY_ABI,
              functionName: "getSubmissionCount",
              args: [BigInt(id)],
              chainId: chainId as any,
            });

            const submissions: Submission[] = [];
            for (let i = 0; i < Number(submissionCount); i++) {
              const sData = await readContract(wagmiConfig, {
                address: CONTRACT_ADDRESSES[chainId].Quinty as `0x${string}`,
                abi: QUINTY_ABI,
                functionName: "getSubmissionStruct",
                args: [BigInt(id), BigInt(i)],
                chainId: chainId as any,
              });
              if (sData) submissions.push(sData as unknown as Submission);
            }

            const metadataMatch = b[1].match(/Metadata: ipfs:\/\/([a-zA-Z0-9]+)/);
            const metadataCid = metadataMatch ? metadataMatch[1] : undefined;

            loadedBounties.push({
              id,
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
          }
        } catch (error) {
          console.error(`Error loading bounty ${id}:`, error);
        }
      }
      setBounties(loadedBounties.reverse());
    } catch (error) {
      console.error("Error loading bounties:", error);
    }
  };

  const createBounty = async () => {
    if (!isConnected) return;
    const deadlineTimestamp = Math.floor(new Date(newBounty.deadline).getTime() / 1000);
    const nowTimestamp = Math.floor(Date.now() / 1000);
    if (deadlineTimestamp <= nowTimestamp) {
      alert("Deadline must be in the future.");
      return;
    }

    if (!newBounty.amount || parseFloat(newBounty.amount) <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    if (newBounty.slashPercent < 25 || newBounty.slashPercent > 50) {
      alert("Slash percent must be between 25% and 50%");
      return;
    }

    if (newBounty.allowMultipleWinners) {
      const totalShares = newBounty.winnerShares.reduce((a, b) => a + b, 0);
      if (totalShares !== 100) {
        alert("Winner shares must sum to 100%");
        return;
      }
    }

    try {
      const imageCids = await uploadImages();
      const metadata: BountyMetadata = {
        title: newBounty.title,
        description: newBounty.description,
        requirements: newBounty.requirements.filter((r) => r.trim()),
        deliverables: newBounty.deliverables.filter((d) => d.trim()),
        skills: newBounty.skills.filter((s) => s.trim()),
        images: imageCids,
        deadline: deadlineTimestamp,
        bountyType: newBounty.bountyType,
      };

      const metadataCid = await uploadMetadataToIpfs(metadata);
      const descriptionWithMetadata = `${newBounty.title}\n\nMetadata: ipfs://${metadataCid}`;
      const winnerSharesArg = newBounty.allowMultipleWinners
        ? newBounty.winnerShares.map((s) => BigInt(s * 100))
        : [];
      const oprecDeadlineTimestamp = newBounty.hasOprec && newBounty.oprecDeadline
        ? Math.floor(new Date(newBounty.oprecDeadline).getTime() / 1000)
        : 0;

      writeContract({
        address: CONTRACT_ADDRESSES[chainId].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "createBounty",
        args: [
          descriptionWithMetadata,
          BigInt(deadlineTimestamp),
          newBounty.allowMultipleWinners,
          winnerSharesArg,
          BigInt(newBounty.slashPercent * 100),
          newBounty.hasOprec,
          BigInt(oprecDeadlineTimestamp),
        ],
        value: parseETH(newBounty.amount),
      });

      // Reset form handled in effect
    } catch (error) {
      console.error("Error creating bounty:", error);
      alert("Error creating bounty");
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      loadBountiesAndSubmissions();
      setShowCreateForm(false);
      setNewBounty({
        title: "",
        description: "",
        amount: "",
        deadline: "",
        slashPercent: 30,
        allowMultipleWinners: false,
        winnerShares: [100],
        bountyType: "development",
        requirements: [""],
        deliverables: [""],
        skills: [""],
        images: [],
        hasOprec: false,
        oprecDeadline: "",
      });
      setDeadlineDate(undefined);
      setUploadedFiles([]);
    }
  }, [isConfirmed]);

  const getFilteredBounties = () => {
    const bounciesToFilter = bounties.length === 0 ? mockBounties : bounties;
    return bounciesToFilter.filter((bounty) => {
      if (typeFilter !== "all") {
        const bountyType = bounty.metadataCid ? "development" : "other";
        if (bountyType !== typeFilter) return false;
      }
      if (statusFilter !== "all") {
        const isExpired = now > 0 && BigInt(now) > bounty.deadline;
        const isResolved = bounty.status === 3;
        if (statusFilter === "active" && (isExpired || isResolved)) return false;
        if (statusFilter === "resolved" && !isResolved) return false;
        if (statusFilter === "expired" && !isExpired) return false;
      }
      if (showMyBounties && address) {
        return bounty.creator.toLowerCase() === address.toLowerCase();
      }
      return true;
    });
  };

  const filteredBounties = getFilteredBounties();

  // Helper for dynamic list inputs
  const renderListInput = (
    items: string[],
    onChange: (newItems: string[]) => void,
    placeholder: string
  ) => (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const newItems = [...items];
              newItems[index] = e.target.value;
              onChange(newItems);
            }}
            placeholder={placeholder}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            className="bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-red-500/20"
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...items, ""])}
        className="w-full bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Item
      </Button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#111] border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Showing</span>
              <span className="text-sm font-bold text-white">{filteredBounties.length}</span>
              <span className="text-sm text-gray-400">bounties</span>
            </div>
            {/* Indexer status indicator disabled */}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {!showCreateForm && (
            <>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl bg-[#111] border-white/10 text-white hover:bg-white/5 transition-colors">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-white/10 text-white rounded-xl">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl bg-[#111] border-white/10 text-white hover:bg-white/5 transition-colors">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-white/10 text-white rounded-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              {isConnected && (
                <Button
                  variant="outline"
                  onClick={() => setShowMyBounties(!showMyBounties)}
                  className={`h-10 rounded-xl border-white/10 transition-all ${showMyBounties ? 'bg-blue-500/10 text-blue-400 border-blue-500/50' : 'bg-[#111] text-gray-300 hover:bg-white/5 hover:text-white'}`}
                >
                  {showMyBounties ? "My Bounties" : "My Bounties"}
                </Button>
              )}
            </>
          )}

          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`h-10 rounded-xl px-6 font-medium transition-all shadow-lg ${showCreateForm ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'}`}
          >
            {showCreateForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showCreateForm ? "Cancel" : "Create Bounty"}
          </Button>
        </div>
      </div>

      {/* Create Bounty Form */}
      {showCreateForm && (
        <div className="rounded-3xl bg-[#111] border border-white/5 overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="p-8 border-b border-white/5 bg-gradient-to-r from-blue-900/10 to-purple-900/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Create New Bounty</h2>
                <p className="text-gray-400 text-sm">Define your task, set the reward, and launch on Arbitrum</p>
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              {/* Basic Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">1</span>
                  Basic Details
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Title</label>
                  <Input
                    value={newBounty.title}
                    onChange={(e) => setNewBounty({ ...newBounty, title: e.target.value })}
                    placeholder="e.g., Build a DeFi Dashboard"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Reward Amount (ETH)</label>
                    <Input
                      type="number"
                      value={newBounty.amount}
                      onChange={(e) => setNewBounty({ ...newBounty, amount: e.target.value })}
                      placeholder="0.0"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Category</label>
                    <Select
                      value={newBounty.bountyType}
                      onValueChange={(v: any) => setNewBounty({ ...newBounty, bountyType: v })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111] border-white/10 text-white">
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Description</label>
                  <Textarea
                    value={newBounty.description}
                    onChange={(e) => setNewBounty({ ...newBounty, description: e.target.value })}
                    placeholder="Describe the task in detail..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50 min-h-[120px]"
                  />
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">2</span>
                  Advanced Settings
                </h3>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-white">Slash Percentage</label>
                      <span className="text-sm font-bold text-blue-400">{newBounty.slashPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="25"
                      max="50"
                      value={newBounty.slashPercent}
                      onChange={(e) => setNewBounty({ ...newBounty, slashPercent: parseInt(e.target.value) })}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="hasOprec"
                      checked={newBounty.hasOprec}
                      onChange={(e) => setNewBounty({ ...newBounty, hasOprec: e.target.checked })}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/20"
                    />
                    <label htmlFor="hasOprec" className="text-sm text-white">Enable OPREC (Open Recruitment)</label>
                  </div>

                  {newBounty.hasOprec && (
                    <div className="pl-7 space-y-2">
                      <label className="text-xs text-gray-400">OPREC Deadline</label>
                      <Input
                        type="datetime-local"
                        value={newBounty.oprecDeadline}
                        onChange={(e) => setNewBounty({ ...newBounty, oprecDeadline: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="allowMultipleWinners"
                      checked={newBounty.allowMultipleWinners}
                      onChange={(e) => setNewBounty({
                        ...newBounty,
                        allowMultipleWinners: e.target.checked,
                        winnerShares: e.target.checked ? [50, 50] : [100]
                      })}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/20"
                    />
                    <label htmlFor="allowMultipleWinners" className="text-sm text-white">Allow Multiple Winners</label>
                  </div>

                  {newBounty.allowMultipleWinners && (
                    <div className="pl-7 space-y-2">
                      <label className="text-xs text-gray-400">Winner Shares (%)</label>
                      {newBounty.winnerShares.map((share, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="number"
                            value={share}
                            onChange={(e) => {
                              const newShares = [...newBounty.winnerShares];
                              newShares[index] = parseInt(e.target.value) || 0;
                              setNewBounty({ ...newBounty, winnerShares: newShares });
                            }}
                            className="bg-white/5 border-white/10 text-white"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newShares = newBounty.winnerShares.filter((_, i) => i !== index);
                              setNewBounty({ ...newBounty, winnerShares: newShares });
                            }}
                            className="bg-white/5 border-white/10 text-gray-400 hover:text-white"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewBounty({ ...newBounty, winnerShares: [...newBounty.winnerShares, 0] })}
                        className="w-full bg-white/5 border-white/10 text-gray-400 hover:text-white"
                      >
                        <Plus className="w-3 h-3 mr-2" /> Add Share
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Requirements & Skills */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">3</span>
                  Requirements & Skills
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Requirements</label>
                    {renderListInput(
                      newBounty.requirements,
                      (newItems) => setNewBounty({ ...newBounty, requirements: newItems }),
                      "Add a requirement..."
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Deliverables</label>
                    {renderListInput(
                      newBounty.deliverables,
                      (newItems) => setNewBounty({ ...newBounty, deliverables: newItems }),
                      "Add a deliverable..."
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Skills</label>
                    {renderListInput(
                      newBounty.skills,
                      (newItems) => setNewBounty({ ...newBounty, skills: newItems }),
                      "e.g. React, Solidity..."
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline & Assets */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">4</span>
                  Timeline & Assets
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Deadline</label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="date"
                      onChange={(e) => setDeadlineDate(e.target.valueAsDate || undefined)}
                      className="bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                    />
                    <Input
                      type="time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Images (Optional)</label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer relative ${isDragOver ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:bg-white/5"}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      {uploadedFiles.length > 0
                        ? `${uploadedFiles.length} files selected`
                        : "Drop images here or click to upload"}
                    </p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg border border-white/10"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 space-y-4">
                  {hash && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs text-blue-400 break-all">
                        Tx: <a href={`https://sepolia.arbiscan.io/tx/${hash}`} target="_blank" rel="noreferrer" className="underline">{hash}</a>
                      </p>
                    </div>
                  )}
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-xs text-red-500">{error.message}</p>
                    </div>
                  )}

                  <Button
                    onClick={createBounty}
                    disabled={isPending || isUploadingImages}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-lg shadow-lg shadow-blue-500/20"
                  >
                    {isPending || isUploadingImages ? "Creating..." : "Launch Bounty"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bounty Grid */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {filteredBounties.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} viewMode={viewMode} />
        ))}
      </div>

      {filteredBounties.length === 0 && (
        <div className="text-center py-20 rounded-3xl border border-dashed border-white/10 bg-white/5">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
            <Target className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Bounties Found</h3>
          <p className="text-gray-400">Try adjusting your filters or create a new bounty.</p>
        </div>
      )}
    </div>
  );
}
