import mongoose from "mongoose";
import { ethers } from "ethers";

export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  walletAddress: string;
  nonce: string;
  lastSignIn: Date;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (v: string) => ethers.isAddress(v),
        message: "Invalid Ethereum address",
      },
    },
    nonce: {
      type: String,
      required: true,
    },
    lastSignIn: {
      type: Date,
      default: null,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Sanitize before save
UserSchema.pre("save", function (next) {
  if (this.walletAddress) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }
  next();
});

export default mongoose.model<IUser>("User", UserSchema);
