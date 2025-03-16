import mongoose from "mongoose";

export interface ITransaction extends mongoose.Document {
  stakeId?: number;
  type: "STAKE" | "UNSTAKE" | "CLAIM_REWARDS" | "BRIDGE";
  user: string;
  token: string;
  amount: string;
  duration?: string;
  txHash: string;
  blockNumber: number;
  early?: boolean;
  messageId?: string;
  destinationChainSelector?: string;
  nativeToken?: string;
  nativeFee?: string;
  createdAt: Date;
}

const TransactionSchema = new mongoose.Schema<ITransaction>(
  {
    stakeId: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["STAKE", "UNSTAKE", "CLAIM_REWARDS", "BRIDGE"],
    },
    user: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
    },
    txHash: {
      type: String,
      required: true,
      unique: true,
    },
    blockNumber: {
      type: Number,
      required: true,
    },
    early: {
      type: Boolean,
    },
    messageId: {
      type: String,
    },
    destinationChainSelector: {
      type: String,
    },
    nativeToken: {
      type: String,
    },
    nativeFee: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITransaction>("Transaction", TransactionSchema);
