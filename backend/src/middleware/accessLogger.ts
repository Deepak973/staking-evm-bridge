import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export const accessLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  // Log when the request completes
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info("Access Log", {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      timestamp: new Date().toISOString(),
    });
  });

  next();
};
