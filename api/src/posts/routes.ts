import { FastifyInstance } from "fastify";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";
import { createPostSchema, updatePostSchema, postIdSchema } from "./schemas";
import { NotFoundError, ForbiddenError } from "../errors";

export async function postsRoutes(app: FastifyInstance) {
  // Create post (auth required)
  app.post("/posts", { preHandler: requireAuth }, async (req, reply) => {
    const { title, content, status } = createPostSchema.parse(req.body);

    const post = await db.post.create({
      data: {
        title,
        content,
        status,
        userId: req.user.userId,
      },
    });

    return reply.code(201).send({ post });
  });

  // List all posts (public)
  app.get("/posts", async (req, reply) => {
    const posts = await db.post.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, email: true } },
      },
    });

    return reply.send({ posts });
  });

  // List my posts (auth required) - MUST be before :id route
  app.get("/posts/me", { preHandler: requireAuth }, async (req, reply) => {
    const posts = await db.post.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });

    return reply.send({ posts });
  });

  // Get single post (public)
  app.get("/posts/:id", async (req, reply) => {
    const { id } = postIdSchema.parse(req.params);

    const post = await db.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, email: true } },
      },
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    return reply.send({ post });
  });

  // Update post (owner only)
  app.put("/posts/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = postIdSchema.parse(req.params);
    const updates = updatePostSchema.parse(req.body);

    const post = await db.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    if (post.userId !== req.user.userId) {
      throw new ForbiddenError("You can only update your own posts");
    }

    const updated = await db.post.update({
      where: { id },
      data: updates,
    });

    return reply.send({ post: updated });
  });

  // Delete post (owner only)
  app.delete("/posts/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { id } = postIdSchema.parse(req.params);

    const post = await db.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    if (post.userId !== req.user.userId) {
      throw new ForbiddenError("You can only delete your own posts");
    }

    await db.post.delete({ where: { id } });

    return reply.code(204).send();
  });
}
