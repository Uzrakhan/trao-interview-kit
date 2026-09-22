import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication required",
        },
      });
    }

    const payload = verifyToken(token);

    req.userId = payload.userId;

    next();
  } catch {
    return res.status(401).json({
      error: {
        code: "INVALID_SESSION",
        message: "Session is invalid or expired",
      },
    });
  }
}