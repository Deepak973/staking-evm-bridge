import { Request, Response, NextFunction } from "express";

export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip CSRF check for authentication endpoints
  if (req.path === "/api/auth/verify" || req.path === "/api/auth/signout") {
    return next();
  }

  const csrfToken = req.cookies.csrf_token;

  const headerToken = req.headers["x-csrf-token"];

  if (!csrfToken || !headerToken || csrfToken !== headerToken) {
    res.status(403).json({ error: "Invalid CSRF token" });
    return;
  }

  next();
};
