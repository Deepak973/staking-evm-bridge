import { ethers } from "ethers";
import contractABI from "../utils/StakingBridge.json";
import Transaction from "../models/Transaction";
import logger from "../utils/logger";
import contractAddress from "../utils/contractAddress.json";

export class ContractEventService {
  private provider: ethers.WebSocketProvider;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.WebSocketProvider(
      "wss://base-sepolia.g.alchemy.com/v2/9WBG_MVRsmOhaR5bEVKYclPwb_q9tIiw"
    );
    this.contract = new ethers.Contract(
      contractAddress.Implementation,
      contractABI.abi,
      this.provider
    );
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    // Listen for Stake events
    this.contract.addListener(
      "Staked",
      async (stakeId, user, token, amount, duration, event: any) => {
        try {
          const transaction = new Transaction({
            stakeId: Number(stakeId),
            type: "STAKE",
            user: user.toLowerCase(),
            token: token.toLowerCase(),
            amount: amount.toString(),
            duration: duration.toString(),
            txHash: event.log.transactionHash,
            blockNumber: event.log.blockNumber,
          });

          await transaction.save();
          logger.info(`Stake event saved: ${event.log.transactionHash}`);
        } catch (error) {
          logger.error("Error saving stake event:", error);
        }
      }
    );

    // Listen for Unstake events
    this.contract.addListener(
      "Unstaked",
      async (stakeId, user, token, amount, early, event: any) => {
        try {
          const transaction = new Transaction({
            stakeId: Number(stakeId),
            type: "UNSTAKE",
            user: user.toLowerCase(),
            token: token.toLowerCase(),
            amount: amount.toString(),
            txHash: event.log.transactionHash,
            blockNumber: event.log.blockNumber,
            early,
          });

          await transaction.save();
          logger.info(`Unstake event saved: ${event.log.transactionHash}`);
        } catch (error) {
          logger.error("Error saving unstake event:", error);
        }
      }
    );

    // Listen for ClaimedRewards events
    this.contract.addListener(
      "ClaimedRewards",
      async (stakeId, user, token, amount, event: any) => {
        try {
          const transaction = new Transaction({
            stakeId: Number(stakeId),
            type: "CLAIM_REWARDS",
            user: user.toLowerCase(),
            token: token.toLowerCase(),
            amount: amount.toString(),
            txHash: event.log.transactionHash,
            blockNumber: event.log.blockNumber,
          });

          await transaction.save();
          logger.info(
            `Claim rewards event saved: ${event.log.transactionHash}`
          );
        } catch (error) {
          logger.error("Error saving claim rewards event:", error);
        }
      }
    );

    // Listen for TokensTransferredCrossChain events
    this.contract.addListener(
      "TokensTransferredCrossChain",
      async (
        messageId,
        destinationChainSelector,
        receiver,
        token,
        amount,
        nativeToken,
        nativeFee,
        event: any
      ) => {
        try {
          const transaction = new Transaction({
            type: "BRIDGE",
            user: receiver.toLowerCase(),
            token: token.toLowerCase(),
            amount: amount.toString(),
            txHash: event.log.transactionHash,
            blockNumber: event.log.blockNumber,
            messageId: messageId,
            destinationChainSelector: destinationChainSelector.toString(),
            nativeToken: nativeToken.toLowerCase(),
            nativeFee: nativeFee.toString(),
          });

          await transaction.save();
          logger.info(
            `Cross chain transfer event saved: ${event.log.transactionHash}`
          );
        } catch (error) {
          logger.error("Error saving cross chain transfer event:", error);
        }
      }
    );

    // Handle provider errors
    this.provider.on("error", (error) => {
      logger.error("Provider error:", error);
    });

    logger.info("Contract event listeners initialized");
  }
}
