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
import { RequireWallet } from "../components/RequireWallet";

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

// Add these helper functions
const calculateRewardsInfo = (startTime: bigint, duration: number) => {
  const SECONDS_IN_DAY = 86400;
  const REWARDS_THRESHOLD = 180 * SECONDS_IN_DAY; // 180 days in seconds
  const now = Math.floor(Date.now() / 1000);
  const stakeStart = Number(startTime);
  const timeStaked = now - stakeStart;
  const daysStaked = Math.floor(timeStaked / SECONDS_IN_DAY);

  const durationMap = {
    0: 30, // 1 month
    1: 180, // 6 months
    2: 365, // 1 year
    3: 730, // 2 years
  };

  const totalDays = durationMap[duration as keyof typeof durationMap];
  const isLongTermStake = totalDays >= 180; // Check if stake duration is 6 months or more
  const daysUntilRewards = isLongTermStake ? Math.max(180 - daysStaked, 0) : 0;
  const isEligibleForRewards = timeStaked >= REWARDS_THRESHOLD;

  return {
    daysStaked,
    daysUntilRewards,
    isEligibleForRewards,
    totalDays,
    progress: (daysStaked / totalDays) * 100,
    isLongTermStake,
  };
};

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

  // if (!isAuthed) {
  //   return <div>Please sign in to stake</div>;
  // }

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

    // Show warning modal/toast before unstaking
    if (
      !window.confirm(
        "Early unstaking will incur a 10% penalty fee and you will forfeit any unclaimed rewards. Do you wish to continue?"
      )
    ) {
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

  return (
    <RequireWallet>
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staked Assets</h1>
            <p className="mt-1 text-gray-500">
              Manage your staked assets and rewards
            </p>
          </div>
          <div className="flex gap-4">
            {/* Summary Cards */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-sm text-blue-600">Active Stakes</p>
              <p className="text-2xl font-bold text-blue-700">
                {stakedAssets.filter((s) => !s.claimed).length}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-sm text-green-600">Available Rewards</p>
              <p className="text-2xl font-bold text-green-700">
                {
                  stakedAssets.filter(
                    (s) => s.allowedToClaimRewards && !s.rewardsClaimed
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
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
              {filteredStakes.map((stake, index) => {
                const rewardsInfo = calculateRewardsInfo(
                  stake.startTime,
                  stake.duration
                );

                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all hover:shadow-md"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-semibold">
                              {stake.token ===
                              "0x0000000000000000000000000000000000000000"
                                ? "ETH"
                                : tokenDetails[stake.token]?.symbol ||
                                  "Loading..."}
                            </h3>
                            {!stake.claimed && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600">
                            {stake.token ===
                            "0x0000000000000000000000000000000000000000"
                              ? formatEther(stake.amount)
                              : formatUnits(
                                  stake.amount,
                                  Number(
                                    tokenDetails[stake.token]?.decimals || 18
                                  )
                                )}{" "}
                            {stake.token ===
                            "0x0000000000000000000000000000000000000000"
                              ? "ETH"
                              : tokenDetails[stake.token]?.symbol}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">
                            Duration: {formatDuration(stake.duration)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Started:{" "}
                            {new Date(
                              Number(stake.startTime) * 1000
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{
                              width: `${Math.min(rewardsInfo.progress, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span>{rewardsInfo.daysStaked} days staked</span>
                          <span>{rewardsInfo.totalDays} days total</span>
                        </div>
                      </div>

                      {/* Rewards Info */}
                      {!stake.claimed && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-500">🏆</span>
                            <h4 className="font-medium">Rewards Status</h4>
                          </div>
                          {rewardsInfo.isLongTermStake ? (
                            rewardsInfo.isEligibleForRewards ? (
                              <p className="text-green-600">
                                Eligible for rewards! You can claim your rewards
                                now.
                              </p>
                            ) : (
                              <p className="text-gray-600">
                                {rewardsInfo.daysUntilRewards} days until
                                rewards eligibility
                              </p>
                            )
                          ) : (
                            <p className="text-gray-500">
                              Not eligible for bonus rewards as staking period
                              is less than 6 months
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        {!stake.claimed && (
                          <button
                            onClick={() => handleUnstake(index)}
                            disabled={isUnstaking[index]}
                            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors group relative"
                          >
                            {isUnstaking[index] ? "Unstaking..." : "Unstake"}
                            {/* Tooltip */}
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              10% penalty fee applies for early unstaking
                            </span>
                          </button>
                        )}

                        {stake.allowedToClaimRewards &&
                          !stake.rewardsClaimed && (
                            <button
                              onClick={() => handleClaimRewards(index)}
                              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                              Claim Rewards
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RequireWallet>
  );
}
