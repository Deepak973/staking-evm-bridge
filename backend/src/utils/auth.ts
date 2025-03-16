import { ethers } from "ethers";
import jwt from "jsonwebtoken";
import { Request } from "express";
import logger from "./logger";

export const verifySignature = (
  message: string,
  signature: string,
  address: string
): boolean => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    logger.error("Signature verification failed:", error);
    return false;
  }
};

export const generateToken = (
  userId: string,
  walletAddress: string
): string => {
  return jwt.sign(
    { id: userId, walletAddress },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "7d",
    }
  );
};

export const generateNonce = (): string => {
  return Math.floor(Math.random() * 1000000).toString();
};

export const getAuthMessage = (nonce: string): string => {
  return `Welcome to StakingIt!\n\nPlease sign this message to authenticate.\nNonce: ${nonce}\nThis signature will not trigger a blockchain transaction or cost any gas fees.`;
};
