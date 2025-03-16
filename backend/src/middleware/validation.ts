import { Request, Response, NextFunction } from "express";
import { ethers } from "ethers";

export const validateAddress = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const address = req.params.address || req.body.address;

  if (!address || !ethers.isAddress(address)) {
    res.status(400).json({ error: "Invalid Ethereum address" });
    return;
  }

  next();
};
