"use client";
import { useState, useEffect } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { erc20Abi } from "viem";
import contractABI from "@/app/utils/StakingBridge.json";
import contractAddress from "@/app/utils/contractAddress.json";
import { waitForTransactionReceipt } from "@wagmi/core";
import { toast } from "react-hot-toast";
import { config } from "@/app/config/config";
import { getTokenDetails } from "../utils/getTokenDetails";
import { TokenDetails } from "../utils/tokenInterface";
import { getEstimatedFees } from "@/app/utils/getEstimatedFees";

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const USDC_DECIMALS = 6;

const CHAIN_SELECTORS = {
  "Arbitrum Sepolia": "3478487238524512106",
  "Ethereum Sepolia": "16015286601757825753",
  "Optimism Sepolia": "5224473277236331295",
};

export function CrossChainBridge() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [amount, setAmount] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [selectedChain, setSelectedChain] =
    useState<keyof typeof CHAIN_SELECTORS>("Arbitrum Sepolia");
  const [isApproving, setIsApproving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [hasAllowance, setHasAllowance] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<bigint | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Load USDC details
  useEffect(() => {
    async function loadUSDCDetails() {
      if (!isConnected || !address) return;
      try {
        const details = await getTokenDetails(
          USDC_ADDRESS,
          address,
          contractAddress.Proxy
        );
        setTokenDetails(details);
      } catch (error) {
        console.error("Error loading USDC details:", error);
        toast.error("Failed to load USDC details");
      }
    }
    loadUSDCDetails();
  }, [address, isConnected]);

  // Calculate remaining balance
  const calculateRemainingBalance = () => {
    if (!amount || !tokenDetails) return null;
    try {
      const amountInUSDC = parseUnits(amount, USDC_DECIMALS);
      const remaining = tokenDetails.balance - amountInUSDC;
      return {
        formatted: formatUnits(remaining, USDC_DECIMALS),
        isNegative: remaining < BigInt(0),
      };
    } catch (e) {
      return null;
    }
  };

  // Check for insufficient balance
  useEffect(() => {
    const remaining = calculateRemainingBalance();
    setInsufficientBalance(remaining?.isNegative ?? false);
  }, [amount, tokenDetails]);

  // Check allowance when amount changes or when token details load
  useEffect(() => {
    async function checkAllowance() {
      if (!amount || !tokenDetails) {
        setHasAllowance(false);
        return;
      }

      try {
        const amountInUSDC = parseUnits(amount, USDC_DECIMALS);
        setHasAllowance(tokenDetails.allowance >= amountInUSDC);
      } catch (e) {
        setHasAllowance(false);
      }
    }

    checkAllowance();
  }, [amount, tokenDetails]);

  //  get Estimated Fees
  useEffect(() => {
    async function calculateFees() {
      if (!amount || !receiverAddress) {
        setEstimatedFee(null);
        return;
      }

      try {
        const amountInUSDC = parseUnits(amount, USDC_DECIMALS);
        const fees = await getEstimatedFees(
          CHAIN_SELECTORS[selectedChain],
          receiverAddress,
          USDC_ADDRESS,
          amountInUSDC
        );
        setEstimatedFee(fees);
      } catch (error) {
        console.error("Error estimating fees:", error);
        setEstimatedFee(null);
      }
    }

    calculateFees();
  }, [amount, selectedChain, receiverAddress]);

  const handleCrossChainTransfer = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!amount || !receiverAddress) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSending(true);
    setLastTxHash(null);
    const loadingToastId = toast.loading("Processing cross-chain transfer...");

    try {
      const amountInUSDC = parseUnits(amount, USDC_DECIMALS);

      // Get estimated fees
      const estimatedFees = await getEstimatedFees(
        CHAIN_SELECTORS[selectedChain],
        receiverAddress,
        USDC_ADDRESS,
        amountInUSDC
      );

      // Make the cross-chain transfer with the estimated fees
      const txHash = await writeContractAsync({
        address: contractAddress.Proxy as `0x${string}`,
        abi: contractABI.abi,
        functionName: "transferTokenCrossChain",
        args: [
          BigInt(CHAIN_SELECTORS[selectedChain]),
          receiverAddress as `0x${string}`,
          USDC_ADDRESS as `0x${string}`,
          amountInUSDC,
        ],
        value: estimatedFees,
      });

      const receipt = await waitForTransactionReceipt(config as any, {
        hash: txHash,
      });

      toast.dismiss(loadingToastId);

      if (receipt.status === "success") {
        setLastTxHash(txHash);
        toast.success("Cross-chain transfer initiated!");
        setAmount("");
        setReceiverAddress("");
      } else {
        toast.error("Cross-chain transfer failed");
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      console.error("Error in cross-chain transfer:", error);
      toast.error("Failed to process cross-chain transfer");
    } finally {
      setIsSending(false);
    }
  };

  const handleApprove = async () => {
    if (!amount) return;
    setIsApproving(true);
    // Create a loading toast ID for approval
    const approvalToastId = toast.loading("Approving USDC...");

    try {
      const amountInUSDC = parseUnits(amount, USDC_DECIMALS);
      const hash = await writeContractAsync({
        address: USDC_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [contractAddress.Proxy as `0x${string}`, amountInUSDC],
      });

      const receipt = await waitForTransactionReceipt(config as any, {
        hash,
      });

      // Dismiss the approval loading toast
      toast.dismiss(approvalToastId);

      if (receipt.status === "success") {
        toast.success("USDC approved!");
        handleCrossChainTransfer();
      } else {
        toast.error("USDC approval failed!");
      }
    } catch (error) {
      // Dismiss the approval loading toast on error
      toast.dismiss(approvalToastId);
      console.error("Error approving USDC:", error);
      toast.error("Failed to approve USDC");
    } finally {
      setIsApproving(false);
    }
  };

  const handleSend = async () => {
    if (!amount || !receiverAddress) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!hasAllowance) {
      await handleApprove();
    } else {
      await handleCrossChainTransfer();
    }
  };

  return (
    <div className="space-y-6">
      {/* Show USDC Balance */}
      {tokenDetails && (
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium">
            {tokenDetails.name} ({tokenDetails.symbol})
          </p>
          <p className="text-sm text-gray-600">
            Balance: {formatUnits(tokenDetails.balance, USDC_DECIMALS)} USDC
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Destination Chain
        </label>
        <select
          value={selectedChain}
          onChange={(e) =>
            setSelectedChain(e.target.value as keyof typeof CHAIN_SELECTORS)
          }
          className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {Object.keys(CHAIN_SELECTORS).map((chain) => (
            <option key={chain} value={chain}>
              {chain}
            </option>
          ))}
        </select>
        {estimatedFee && (
          <div className="mt-2 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-600">
              Estimated CCIP Fees: {formatUnits(estimatedFee, 18)} ETH
            </p>
            <p className="text-xs text-blue-500 mt-1">
              *You will need this amount of ETH to cover cross-chain fees
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Receiver Address
        </label>
        <input
          type="text"
          value={receiverAddress}
          onChange={(e) => setReceiverAddress(e.target.value)}
          placeholder="Enter receiver address"
          className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Amount (USDC)
        </label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter USDC amount"
          className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        {amount && (
          <div className="text-sm">
            {calculateRemainingBalance()?.isNegative ? (
              <p className="text-red-500">Insufficient balance</p>
            ) : (
              <p className="text-gray-600">
                Remaining balance: {calculateRemainingBalance()?.formatted} USDC
              </p>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleSend}
        disabled={
          isApproving ||
          isSending ||
          !amount ||
          !receiverAddress ||
          insufficientBalance ||
          !tokenDetails
        }
        className="w-full py-2 px-4 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isApproving
          ? "Approving..."
          : isSending
          ? "Sending..."
          : insufficientBalance
          ? "Insufficient Balance"
          : hasAllowance
          ? "Send USDC Cross-Chain"
          : "Approve & Send USDC"}
      </button>

      {/* Add Transaction Hash Display */}
      {lastTxHash && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="text-sm font-medium text-gray-700">Transaction Hash:</p>
          <div className="flex items-center gap-2">
            <a
              href={`https://ccip.chain.link/tx/${lastTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 truncate"
            >
              {lastTxHash}
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(lastTxHash)}
              className="text-gray-500 hover:text-gray-700"
              title="Copy to clipboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
