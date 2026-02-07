import { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { db } from "../db";
import { hashPassword, verifyPassword } from "./password";
import { signToken } from "./jwt";
import { registerSchema, loginSchema } from "./schemas";
import { ConflictError, UnauthorizedError } from "../errors";
import { requireAuth } from "../middleware/auth";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (req, reply) => {
    const { email, password } = registerSchema.parse(req.body);

    try {
      const user = await db.user.create({
        data: { email, password: await hashPassword(password) },
      });

      return reply.code(201).send({ token: signToken({ userId: user.id }) });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError("Email already registered");
      }
      throw err;
    }
  });

  app.post("/auth/login", async (req, reply) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      throw new UnauthorizedError("Invalid credentials");
    }

    return reply.send({ token: signToken({ userId: user.id }) });
  });

  app.get("/auth/me", { preHandler: requireAuth }, async (req, reply) => {
    const user = await db.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, createdAt: true },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    return reply.send({ user });
  });
}