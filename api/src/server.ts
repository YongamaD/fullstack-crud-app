import Fastify from "fastify";
import { authRoutes } from "./auth/routes";
import { config } from "./config";
import { registerErrorHandler } from "./errorHandler";
import { registerSecurityMiddleware } from "./middleware/security";

export function buildServer() {
  const app = Fastify({
    logger: config.NODE_ENV !== "test", // Enable logging except in tests
  });

  // Register error handler FIRST (so it catches all errors)
  registerErrorHandler(app);

  // Register security middleware
  registerSecurityMiddleware(app);

  // Register routes
  app.register(authRoutes);

  app.get("/health", async () => {
    return { status: "ok" };
  });

  return app;
}