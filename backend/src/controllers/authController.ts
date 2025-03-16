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

const getCookieConfig = (httpOnly: boolean) => ({
  httpOnly,
  secure: true,
  sameSite: "none" as const,
  maxAge: 2 * 60 * 60 * 1000, // 2 hours
  domain: ".staking-evm-bridge.vercel.app",
  path: "/",
});

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
    const csrfToken = generateCsrfToken();

    // Set HTTP-only cookies
    res.cookie("auth_token", token, getCookieConfig(true));
    res.cookie("csrf_token_client", csrfToken, getCookieConfig(false));
    res.cookie("csrf_token", csrfToken, getCookieConfig(true));
    res.cookie("auth_token_client", token, getCookieConfig(false));

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
    const cookieConfig = getCookieConfig(true);
    res.clearCookie("auth_token", cookieConfig);
    res.clearCookie("auth_token_client", cookieConfig);
    res.clearCookie("csrf_token", cookieConfig);
    res.clearCookie("csrf_token_client", cookieConfig);

    res.json({ success: true });
  } catch (error) {
    logger.error("signOutUser error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
