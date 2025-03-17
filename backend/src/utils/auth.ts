import { ethers } from "ethers";
import jwt from "jsonwebtoken";
import { Request } from "express";
import logger from "./logger";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

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
      expiresIn: "6900s", // 1 hr 55 min
    }
  );
};

export const generateNonce = (): string => {
  return Math.floor(Math.random() * 1000000).toString();
};

export const getAuthMessage = (): string => {
  return `Sign this message to authenticate.`;
};

export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};
