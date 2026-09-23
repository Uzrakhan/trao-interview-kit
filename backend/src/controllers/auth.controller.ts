import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import { User } from "../models/User.js";
import { createToken } from "../utils/auth.js";

export async function register(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_INPUT",
          message: "Email and password are required",
        },
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: {
          code: "WEAK_PASSWORD",
          message: "Password must be at least 8 characters",
        },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        error: {
          code: "EMAIL_EXISTS",
          message: "An account with this email already exists",
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
    });

    const token = createToken(user.id);

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(201)
      .json({
        user: {
          id: user.id,
          email: user.email,
        },
      });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      error: {
        code: "REGISTRATION_FAILED",
        message: "Unable to create account",
      },
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_INPUT",
          message: "Email and password are required",
        },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
    }

    const token = createToken(user.id);

    res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        user: {
          id: user.id,
          email: user.email,
        },
      });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      error: {
        code: "LOGIN_FAILED",
        message: "Unable to log in",
      },
    });
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("token");

  res.json({
    success: true,
  });
}

export async function me(req: Request, res: Response) {
  const userId = (req as Request & { userId?: string }).userId;

  if (!userId) {
    return res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      },
    });
  }

  const user = await User.findById(userId).select(
    "_id email createdAt"
  );

  if (!user) {
    return res.status(404).json({
      error: {
        code: "USER_NOT_FOUND",
        message: "User no longer exists",
      },
    });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
}