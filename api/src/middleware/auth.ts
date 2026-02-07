import { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken } from "../auth/jwt";
import { UnauthorizedError } from "../errors";

declare module "fastify" {
  interface FastifyRequest {
    user: { userId: string };
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid authorization header");
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix
  const payload = verifyToken(token); // Throws UnauthorizedError if invalid

  request.user = payload;
}
