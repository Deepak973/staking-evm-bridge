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

export default function StakedAssetsPage() {
  const { address, isConnected } = useAccount();

  const { writeContractAsync } = useWriteContract();
  const [stakedAssets, setStakedAssets] = useState<StakedAsset[]>([]);
  const [tokenDetails, setTokenDetails] = useState<{
    [key: string]: TokenDetails;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUnstaking, setIsUnstaking] = useState<{ [key: number]: boolean }>(
    {}
  );

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
      <h1 className="text-2xl font-bold mb-6">Your Staked Assets</h1>

      {stakedAssets.length === 0 ? (
        <p className="text-gray-600">No staked assets found</p>
      ) : (
        <div className="grid gap-4">
          {stakedAssets.map((stake, index) => (
            <div
              key={index}
              className="bg-white shadow-lg rounded-lg p-6 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">
                    {stake.token ===
                    "0x0000000000000000000000000000000000000000"
                      ? "ETH"
                      : tokenDetails[stake.token]?.symbol || "Unknown Token"}
                  </h3>
                  <p className="text-gray-600">
                    Amount:{" "}
                    {stake.token ===
                    "0x0000000000000000000000000000000000000000"
                      ? formatEther(stake.amount)
                      : formatUnits(
                          stake.amount,
                          Number(tokenDetails[stake.token]?.decimals)
                        )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Duration: {formatDuration(stake.duration)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Start Time:{" "}
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
