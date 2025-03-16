"use client";
import * as React from "react";
import {
  useAccount,
  useWriteContract,
  useBalance,
  useReadContract,
} from "wagmi";
import { formatUnits, parseEther, formatEther, parseUnits } from "viem";
import { erc20Abi } from "viem";
import contractABI from "@/app/utils/StakingBridge.json";
import contractAddress from "@/app/utils/contractAddress.json";
import { useEffect, useState } from "react";
import { getTokenDetails } from "../utils/getTokenDetails";
import { waitForTransactionReceipt } from "@wagmi/core";
import { toast } from "react-hot-toast";
import { config } from "@/app/config/config";
import { TokenDetails } from "@/app/utils/tokenInterface";

const DURATION_OPTIONS = {
  ONE_MONTH: { label: "1 Month (30 days)", value: 0 },
  SIX_MONTHS: { label: "6 Months (180 days)", value: 1 },
  ONE_YEAR: { label: "1 Year (365 days)", value: 2 },
  TWO_YEARS: { label: "2 Years (730 days)", value: 3 },
};

export function StakeTokens() {
  const { writeContractAsync } = useWriteContract();
  const { address, isConnected } = useAccount();
  const [isNativeToken, setIsNativeToken] = useState(true);
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(DURATION_OPTIONS.ONE_MONTH.value);
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);

  const { data: ethBalance } = useBalance({
    address,
  });

  const loadTokenDetails = async () => {
    if (!isNativeToken && tokenAddress && address) {
      try {
        const details = await getTokenDetails(
          tokenAddress,
          address,
          contractAddress.Proxy
        );
        console.log(details);
        setTokenDetails(details);
      } catch (error) {
        console.error("Error fetching token details:", error);
        toast.error("Failed to load token details");
      }
    }
  };

  useEffect(() => {
    if (!isNativeToken && amount && tokenDetails) {
      const amountInToken = parseUnits(amount, Number(tokenDetails.decimals));
      setNeedsApproval(amountInToken > tokenDetails.allowance);
    }
  }, [amount, tokenDetails, isNativeToken]);

  const handleStake = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsStaking(true);
    try {
      const amountInWei = parseEther(amount);
      let receipt;

      if (isNativeToken) {
        const txHash = await writeContractAsync({
          address: contractAddress.Proxy as `0x${string}`,
          abi: contractABI.abi,
          functionName: "stakeETH",
          args: [duration],
          value: amountInWei,
        });
        toast.loading("Staking ETH...");
        receipt = await waitForTransactionReceipt(config as any, {
          hash: txHash,
        });
      } else {
        const amountInToken = parseUnits(
          amount,
          Number(tokenDetails?.decimals)
        );
        const txHash = await writeContractAsync({
          address: contractAddress.Proxy as `0x${string}`,
          abi: contractABI.abi,
          functionName: "stakeERC20",
          args: [tokenAddress, amountInToken, duration],
        });
        toast.loading("Staking tokens...");
        receipt = await waitForTransactionReceipt(config as any, {
          hash: txHash,
        });
      }

      if (receipt.status === "success") {
        toast.success("Staking successful!");
        setAmount("");
      } else {
        toast.error("Staking failed!");
      }
    } catch (error) {
      console.error("Error staking:", error);
      toast.error("Failed to stake tokens");
    } finally {
      setIsStaking(false);
    }
  };

  const handleStakeAction = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!isNativeToken && needsApproval) {
      setIsApproving(true);
      try {
        const amountInToken = parseUnits(
          amount,
          Number(tokenDetails?.decimals)
        );
        const hash = await writeContractAsync({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [contractAddress.Proxy as `0x${string}`, amountInToken],
        });

        toast.loading("Approving tokens...");
        const receipt = await waitForTransactionReceipt(config as any, {
          hash,
        });

        if (receipt.status === "success") {
          toast.success("Token approval successful!");
          handleStake();
        } else {
          toast.error("Token approval failed!");
        }
      } catch (error) {
        console.error("Error approving tokens:", error);
        toast.error("Failed to approve tokens");
      } finally {
        setIsApproving(false);
      }
    } else {
      handleStake();
    }
  };

  const calculateRemainingBalance = () => {
    if (!amount) return null;
    try {
      const amountInWei = parseEther(amount);
      if (isNativeToken && ethBalance) {
        const remaining = ethBalance.value - amountInWei;
        return {
          formatted: formatEther(remaining),
          isNegative: remaining < BigInt(0),
        };
      } else if (tokenDetails) {
        const remaining =
          tokenDetails.balance -
          parseUnits(amount, Number(tokenDetails.decimals));
        return {
          formatted: formatUnits(remaining, Number(tokenDetails.decimals)),
          isNegative: remaining < BigInt(0),
        };
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  useEffect(() => {
    loadTokenDetails();
  }, [isNativeToken, tokenAddress, address]);

  useEffect(() => {
    const remaining = calculateRemainingBalance();
    setInsufficientBalance(remaining?.isNegative ?? false);
  }, [amount, isNativeToken, ethBalance, tokenDetails]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            checked={isNativeToken}
            onChange={() => {
              setIsNativeToken(true);
              setTokenAddress("");
              setTokenDetails(null);
            }}
            className="form-radio text-blue-600"
          />
          <span>Stake ETH</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            checked={!isNativeToken}
            onChange={() => setIsNativeToken(false)}
            className="form-radio text-blue-600"
          />
          <span>Stake ERC20 Token</span>
        </label>
      </div>

      {!isNativeToken && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Token Address
          </label>
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="Enter ERC20 Token Address"
            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          {tokenDetails && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium">
                {tokenDetails.name} ({tokenDetails.symbol})
              </p>
              <p className="text-sm text-gray-600">
                Balance:{" "}
                {formatUnits(
                  tokenDetails.balance,
                  Number(tokenDetails.decimals)
                )}{" "}
                {tokenDetails.symbol}
              </p>
            </div>
          )}
        </div>
      )}

      {isNativeToken && ethBalance && (
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium">ETH Balance</p>
          <p className="text-sm text-gray-600">
            Balance: {ethBalance.formatted} ETH
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Amount to Stake
        </label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Enter amount in ${
            isNativeToken ? "ETH" : tokenDetails?.symbol || "tokens"
          }`}
          className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        {amount && (
          <div className="text-sm">
            {calculateRemainingBalance()?.isNegative ? (
              <p className="text-red-500">Insufficient balance</p>
            ) : (
              <p className="text-gray-600">
                Remaining balance: {calculateRemainingBalance()?.formatted}{" "}
                {isNativeToken ? "ETH" : tokenDetails?.symbol}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Staking Duration
        </label>
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {Object.entries(DURATION_OPTIONS).map(([key, option]) => (
            <option key={key} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleStakeAction}
          disabled={
            isStaking ||
            isApproving ||
            !amount ||
            insufficientBalance ||
            (!isNativeToken && !tokenDetails)
          }
          className="w-full py-2 px-4 rounded-md text-white font-medium bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isStaking
            ? "Staking..."
            : isApproving
            ? "Approving..."
            : insufficientBalance
            ? "Insufficient Balance"
            : !isNativeToken && needsApproval
            ? "Approve & Stake"
            : `Stake ${
                isNativeToken ? "ETH" : tokenDetails?.symbol || "Tokens"
              }`}
        </button>
      </div>
    </div>
  );
}
