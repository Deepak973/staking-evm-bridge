import { getContract } from "viem";
import { getChainId } from "@wagmi/core";
import { initializeClient } from "@/app/utils/publicClient";
import { config } from "@/app/utils/config";
import contractABI from "@/app/utils/StakingBridge.json";
import contractAddress from "@/app/utils/contractAddress.json";

export async function getEstimatedFees(
  destinationChainSelector: string,
  receiverAddress: string,
  tokenAddress: string,
  amount: bigint
): Promise<bigint> {
  const chainId = getChainId(config);
  const client = initializeClient(chainId);

  try {
    const contract = getContract({
      address: contractAddress.Proxy as `0x${string}`,
      abi: contractABI.abi,
      client: client,
    });

    const fees: any = await contract.read.estimateFeeForCrossChain([
      BigInt(destinationChainSelector),
      receiverAddress as `0x${string}`,
      tokenAddress as `0x${string}`,
      amount,
    ]);

    return fees;
  } catch (error: any) {
    console.error("Error estimating fees:", error.message);
    throw error;
  }
}
