import { Request, Response } from "express";
import User, { IUser } from "../models/Users";
import {
  verifySignature,
  generateToken,
  generateNonce,
  getAuthMessage,
} from "../utils/auth";
import logger from "../utils/logger";

export const getNonce = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    let user = await User.findOne({ walletAddress: address.toLowerCase() });
    const nonce = generateNonce();

    if (!user) {
      user = new User({
        walletAddress: address.toLowerCase(),
        nonce,
      });
    } else {
      user.nonce = nonce;
    }

    await user.save();

    res.json({
      message: getAuthMessage(nonce),
      nonce,
    });
  } catch (error) {
    logger.error("getNonce error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

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

    const message = getAuthMessage(user.nonce);
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
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Generate CSRF token
    const csrfToken = req.csrfToken();

    res.json({
      success: true,
      user: {
        address: user.walletAddress,
        isAdmin: user.isAdmin,
      },
      csrfToken, // Send CSRF token to client
    });
  } catch (error) {
    logger.error("verifyAuth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
