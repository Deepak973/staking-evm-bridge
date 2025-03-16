import { Abi, createPublicClient, http } from "viem";
import { erc20Abi } from "viem";
import { getContract } from "viem";
import { baseSepolia } from "viem/chains";
import { getChainId } from "@wagmi/core";
import { initializeClient } from "@/app/utils/publicClient";
import { config } from "@/app/utils/config";
import { TokenDetails } from "@/app/utils/tokenInterface";

export async function getTokenDetails(
  TokenAddress: string,
  userAddress: string,
  contractAddress: string
): Promise<TokenDetails | null> {
  const chainId = getChainId(config);
  const client = initializeClient(chainId);
  try {
    const contract = getContract({
      address: TokenAddress as `0x${string}`,
      abi: erc20Abi,
      client: client,
    });
    const name: any = await contract.read.name();
    const symbol: any = await contract.read.symbol();
    const decimals: any = await contract.read.decimals();
    const balance: any = await contract.read.balanceOf([
      userAddress as `0x${string}`,
    ]);
    const allowance: any = await contract.read.allowance([
      userAddress as `0x${string}`,
      contractAddress as `0x${string}`,
    ]);

    console.log(name);

    return {
      name,
      symbol,
      decimals: decimals.toString(),
      balance: balance,
      allowance: allowance,
    };
  } catch (error: any) {
    console.log("loading token error", error.message);
    return null;
  }
}
