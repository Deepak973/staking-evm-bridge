import { Request, Response } from "express";
import User, { IUser } from "../models/Users";
import {
  verifySignature,
  generateToken,
  getAuthMessage,
  generateNonce,
  generateCsrfToken,
} from "../utils/auth";
import logger from "../utils/logger";
import dotenv from "dotenv";

dotenv.config();

export const verifyAuth = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { address, signature } = req.body;
    let user = (await User.findOne({
      walletAddress: address.toLowerCase(),
    })) as IUser;
    if (!user) {
      user = await User.create({
        walletAddress: address.toLowerCase(),
        nonce: generateNonce(),
        lastSignIn: new Date(),
      });
    }
    console.log("Setting cookie for domain:", req.hostname);
    const message = getAuthMessage();
    const isValid = verifySignature(message, signature, address);

    if (!isValid) {
      logger.warn(`Invalid signature attempt for address: ${address}`);
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
    console.log("CLIENT_ORIGIN", process.env.CLIENT_ORIGIN);
    // Generate new nonce for next auth
    user.nonce = generateNonce();
    user.lastSignIn = new Date();
    await user.save();

    // Generate JWT
    const token = generateToken(user._id.toString(), user.walletAddress);
    const csrfToken = generateCsrfToken();

    // Set HTTP-only cookies
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    res.cookie("csrf_token_client", csrfToken, {
      httpOnly: false, //  Accessible in frontend
      secure: true,
      sameSite: "none",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    res.cookie("csrf_token", csrfToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });
    res.cookie("auth_token_client", token, {
      httpOnly: false, //  Frontend can read it
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
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
    res.clearCookie("auth_token_client");
    res.clearCookie("csrf_token");
    res.clearCookie("csrf_token_client");

    res.json({ success: true });
  } catch (error) {
    logger.error("signOutUser error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
