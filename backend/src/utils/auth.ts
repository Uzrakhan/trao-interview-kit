import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: string;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export function createToken(userId: string) {
  return jwt.sign(
    {
      userId,
    } satisfies TokenPayload,
    getJwtSecret(),
    {
      expiresIn: "7d",
    }
  );
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
}