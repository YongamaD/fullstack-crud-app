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
  // Support comma-separated origins in CORS_ORIGIN env var
  const allowedOrigins = config.CORS_ORIGIN
    ? config.CORS_ORIGIN.split(",").map((o) => o.trim())
    : [];

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return cb(null, true);
      // Allow configured origins
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // Allow any localhost origin for local development
      if (origin.startsWith("http://localhost:")) return cb(null, true);
      cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  // Rate limiting - Brute force protection
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "15 minutes",
  });
}
