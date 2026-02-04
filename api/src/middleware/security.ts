import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";
import { config } from "../config";

export async function registerSecurityMiddleware(app: FastifyInstance) {
  // Security headers (XSS, clickjacking prevention, etc.)
  await app.register(helmet, {
    contentSecurityPolicy: config.NODE_ENV === "production",
  });

  // CORS - Cross-origin protection
  await app.register(cors, {
    origin: config.CORS_ORIGIN || false, // false = reject all CORS in dev
    credentials: true,
  });

  // Rate limiting - Brute force protection
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "15 minutes",
  });
}
