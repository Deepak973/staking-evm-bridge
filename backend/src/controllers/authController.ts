import { Request, Response } from "express";
import User, { IUser } from "../models/Users";
import {
  verifySignature,
  generateToken,
  getAuthMessage,
  generateNonce,
} from "../utils/auth";
import logger from "../utils/logger";

export const verifyAuth = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { address, signature } = req.body;
    const user = (await User.findOne({
      walletAddress: address.toLowerCase(),
    })) as IUser;
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const message = getAuthMessage();
    const isValid = verifySignature(message, signature, address);

    if (!isValid) {
      logger.warn(`Invalid signature attempt for address: ${address}`);
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Generate new nonce for next auth
    user.nonce = generateNonce();
    user.lastSignIn = new Date();
    await user.save();

    // Generate JWT
    const token = generateToken(user._id.toString(), user.walletAddress);

    // Set HTTP-only cookie with JWT
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    res.json({
      success: true,
      user: {
        address: user.walletAddress,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    logger.error("verifyAuth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const signOutUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    res.clearCookie("auth_token");
    res.json({ success: true });
  } catch (error) {
    logger.error("signOutUser error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
