import { Request, Response, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import User from "../models/Users";

import dotenv from "dotenv";

dotenv.config();

/**
 * @desc Register user
 * @route POST /api/auth/register
 */
export const registerUserController: RequestHandler = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    // Register user in DB
    const user = await User.create({ walletAddress });

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, walletAddress: walletAddress },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    // Set HTTP-only cookie with JWT
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
