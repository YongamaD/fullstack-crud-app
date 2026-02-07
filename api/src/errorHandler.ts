import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";
import { ValidationError, ConflictError, UnauthorizedError, NotFoundError, ForbiddenError } from "./errors";
import { config } from "./config";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: Error | FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // Zod validation errors
    if (error instanceof ZodError) {
      const zodError = error as ZodError;
      return reply.code(400).send({
        error: "Validation failed",
        details: zodError.issues.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      });
    }

    // Custom ValidationError (wraps ZodError)
    if (error instanceof ValidationError) {
      return reply.code(400).send({
        error: error.message,
        details: error.details.issues.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      });
    }

    // ConflictError (409 - resource conflict)
    if (error instanceof ConflictError) {
      return reply.code(409).send({
        error: error.message,
      });
    }

    // UnauthorizedError (401)
    if (error instanceof UnauthorizedError) {
      return reply.code(401).send({
        error: error.message,
      });
    }

    // ForbiddenError (403)
    if (error instanceof ForbiddenError) {
      return reply.code(403).send({
        error: error.message,
      });
    }

    // NotFoundError (404)
    if (error instanceof NotFoundError) {
      return reply.code(404).send({
        error: error.message,
      });
    }

    // Log error (don't expose internal details to client)
    request.log.error(error);

    // Generic server error
    const statusCode = "statusCode" in error ? error.statusCode : 500;
    return reply.code(statusCode || 500).send({
      error: config.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
    });
  });
}
