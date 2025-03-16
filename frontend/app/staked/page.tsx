"use client";

import { useAccount, useWriteContract } from "wagmi";
import { useEffect, useState } from "react";
import { getStakedAssets, StakedAsset } from "../utils/getStakedAssets";
import { formatEther, formatUnits } from "viem";
import { getTokenDetails } from "../utils/getTokenDetails";
import { TokenDetails } from "../utils/tokenInterface";
import { waitForTransactionReceipt } from "@wagmi/core";
import { toast } from "react-hot-toast";
import contractABI from "@/app/utils/StakingBridge.json";
import contractAddress from "@/app/utils/contractAddress.json";
import { config } from "@/app/config/config";
import { UnstakeCountdown } from "../components/UnstakeCountdown";
import { useAuth } from "../context/AuthContext";

function formatDuration(duration: number) {
  switch (duration) {
    case 0:
      return "1 Month";
    case 1:
      return "6 Months";
    case 2:
      return "1 Year";
    case 3:
      return "2 Years";
    default:
      return "Unknown";
  }
}

type TabType = "active" | "previous" | "rewards";

export default function StakedAssetsPage() {
  const { address, isConnected } = useAccount();
  const { isAuthed, signIn, isLoading: isAuthLoading } = useAuth();
  const { writeContractAsync } = useWriteContract();
  const [stakedAssets, setStakedAssets] = useState<StakedAsset[]>([]);
  const [tokenDetails, setTokenDetails] = useState<{
    [key: string]: TokenDetails;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUnstaking, setIsUnstaking] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [activeTab, setActiveTab] = useState<TabType>("active");

  if (!isAuthed) {
    return <div>Please sign in to stake</div>;
  }

  useEffect(() => {
    async function loadStakedAssets() {
      if (!address || !isConnected) return;

      setIsLoading(true);
      try {
        const assets = await getStakedAssets(address);
        setStakedAssets(assets);

        // Load token details for each ERC20 token
        const details: { [key: string]: TokenDetails } = {};
        for (const asset of assets) {
          if (asset.token !== "0x0000000000000000000000000000000000000000") {
            const tokenDetail = await getTokenDetails(
              asset.token,
              address,
              asset.token
            );
            if (tokenDetail) {
              details[asset.token] = tokenDetail;
            }
          }
        }
        setTokenDetails(details);
      } catch (error) {
        console.error("Error loading staked assets:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStakedAssets();
  }, [address, isConnected]);

  const handleUnstake = async (index: number) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsUnstaking((prev) => ({ ...prev, [index]: true }));
    try {
      const txHash = await writeContractAsync({
        address: contractAddress.Proxy as `0x${string}`,
        abi: contractABI.abi,
        functionName: "unstakeManually",
        args: [BigInt(index)],
      });

      toast.loading("Unstaking assets...");
      const receipt = await waitForTransactionReceipt(config as any, {
        hash: txHash,
      });

      if (receipt.status === "success") {
        toast.success("Successfully unstaked!");

        const assets = await getStakedAssets(address as string);
        setStakedAssets(assets);
      } else {
        toast.error("Failed to unstake");
      }
    } catch (error) {
      console.error("Error unstaking:", error);
      toast.error("Failed to unstake");
    } finally {
      setIsUnstaking((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleClaimRewards = async (index: number) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    const loadingToastId = toast.loading("Claiming rewards...");
    try {
      const txHash = await writeContractAsync({
        address: contractAddress.Proxy as `0x${string}`,
        abi: contractABI.abi,
        functionName: "claimRewards",
        args: [BigInt(index)],
      });

      const receipt = await waitForTransactionReceipt(config as any, {
        hash: txHash,
      });

      toast.dismiss(loadingToastId);
      if (receipt.status === "success") {
        toast.success("Successfully claimed rewards!");
        // Refresh staked assets
        const assets = await getStakedAssets(address as string);
        setStakedAssets(assets);
      } else {
        toast.error("Failed to claim rewards");
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      console.error("Error claiming rewards:", error);
      toast.error("Failed to claim rewards");
    }
  };

  // Filter stakes based on active tab
  const filteredStakes = stakedAssets.filter((stake) => {
    switch (activeTab) {
      case "active":
        return !stake.claimed;
      case "previous":
        return stake.claimed;
      case "rewards":
        return stake.allowedToClaimRewards && !stake.rewardsClaimed;
      default:
        return false;
    }
  });

  if (!isConnected) {
    return (
      <div className="py-8 max-w-7xl mx-auto px-4">
        <div className="text-center">
          <p className="text-gray-600">
            Please connect your wallet to view staked assets
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="py-8 max-w-7xl mx-auto px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-4">
            Please sign a message to authenticate your wallet
          </p>
          <button
            onClick={signIn}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Sign Message
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-8 max-w-7xl mx-auto px-4">
        <div className="text-center">
          <p className="text-gray-600">Loading staked assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-7xl mx-auto px-4">
      <h1 className="mb-8 text-3xl font-bold">Staked Assets</h1>

      {/* Enhanced Tabs Design */}
      <div className="mb-8">
        <div className="sm:hidden">
          {/* Mobile Tab Selector */}
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabType)}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          >
            <option value="active">Active Stakes</option>
            <option value="previous">Previous Stakes</option>
            <option value="rewards">Claim Rewards</option>
          </select>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("active")}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === "active"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                  transition-colors duration-200
                `}
              >
                <div className="flex items-center">
                  <span className="mr-2">🔵</span>
                  Active Stakes
                  {filteredStakes.length > 0 && activeTab === "active" && (
                    <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2.5 rounded-full text-xs">
                      {filteredStakes.length}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveTab("previous")}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === "previous"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                  transition-colors duration-200
                `}
              >
                <div className="flex items-center">
                  <span className="mr-2">📜</span>
                  Previous Stakes
                  {filteredStakes.length > 0 && activeTab === "previous" && (
                    <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2.5 rounded-full text-xs">
                      {filteredStakes.length}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveTab("rewards")}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === "rewards"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                  transition-colors duration-200
                `}
              >
                <div className="flex items-center">
                  <span className="mr-2">🎁</span>
                  Claim Rewards
                  {filteredStakes.length > 0 && activeTab === "rewards" && (
                    <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2.5 rounded-full text-xs">
                      {filteredStakes.length}
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Content Section with Shadow */}
      <div className="bg-white rounded-lg shadow-sm">
        {filteredStakes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">
              {activeTab === "active"
                ? "🔍"
                : activeTab === "previous"
                ? "📭"
                : "🎁"}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === "active"
                ? "No Active Stakes"
                : activeTab === "previous"
                ? "No Previous Stakes"
                : "No Rewards Available"}
            </h3>
            <p className="text-gray-500">
              {activeTab === "active"
                ? "You don't have any active stakes at the moment"
                : activeTab === "previous"
                ? "You haven't completed any stakes yet"
                : "You don't have any rewards to claim at this moment"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 p-6">
            {filteredStakes.map((stake, index) => (
              <div
                key={index}
                className="bg-white shadow-lg rounded-lg p-6 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {stake.token ===
                      "0x0000000000000000000000000000000000000000"
                        ? "ETH"
                        : tokenDetails[stake.token]?.symbol || "Loading..."}
                    </h3>
                    <p className="text-gray-600">
                      Amount:{" "}
                      {stake.token ===
                      "0x0000000000000000000000000000000000000000"
                        ? formatEther(stake.amount)
                        : formatUnits(
                            stake.amount,
                            Number(tokenDetails[stake.token]?.decimals || 18)
                          )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Duration: {formatDuration(stake.duration)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Start Date:{" "}
                      {new Date(
                        Number(stake.startTime) * 1000
                      ).toLocaleDateString()}
                    </p>
                    {!stake.claimed && (
                      <UnstakeCountdown
                        startTime={stake.startTime}
                        duration={stake.duration}
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {stake.claimed ? (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                        Unstaked
                      </span>
                    ) : (
                      <>
                        <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                          Staked
                        </span>
                        <button
                          onClick={() => handleUnstake(index)}
                          disabled={isUnstaking[index]}
                          className="px-4 py-1 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {isUnstaking[index] ? "Unstaking..." : "Unstake"}
                        </button>
                      </>
                    )}
                    {stake.allowedToClaimRewards && !stake.rewardsClaimed && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                        Rewards Available
                      </span>
                    )}

                    {activeTab === "rewards" && (
                      <button
                        onClick={() => handleClaimRewards(index)}
                        className="px-4 py-1 bg-green-500 text-white rounded-full text-sm hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Claim Rewards
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
