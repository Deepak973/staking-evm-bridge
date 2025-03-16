import { getContract } from "viem";
import { getChainId } from "@wagmi/core";
import { initializeClient } from "@/app/utils/publicClient";
import { config } from "@/app/utils/config";
import contractABI from "@/app/utils/StakingBridge.json";
import contractAddress from "@/app/utils/contractAddress.json";

export interface StakedAsset {
  user: string;
  token: string;
  amount: bigint;
  startTime: bigint;
  duration: number;
  claimed: boolean;
  rewardsClaimed: boolean;
  allowedToClaimRewards: boolean;
}

export async function getStakedAssets(
  userAddress: string
): Promise<StakedAsset[]> {
  const chainId = getChainId(config);
  const client = initializeClient(chainId);

  try {
    const contract = getContract({
      address: contractAddress.Proxy as `0x${string}`,
      abi: contractABI.abi,
      client: client,
    });

    const stakes: any = await contract.read.getUserStakes([
      userAddress as `0x${string}`,
    ]);

    return stakes;
  } catch (error: any) {
    console.error("Error loading staked assets:", error.message);
    return [];
  }
}
