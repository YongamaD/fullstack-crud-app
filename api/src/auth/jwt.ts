import jwt from "jsonwebtoken";
import { config } from "../config";
import { UnauthorizedError } from "../errors";

const JWT_SECRET = config.JWT_SECRET;

export function signToken(payload: { userId: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (err) {
    throw new UnauthorizedError("Invalid token");
  }
}