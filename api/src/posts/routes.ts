import { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";
import { createPostSchema, updatePostSchema, postIdSchema, paginationSchema } from "./schemas";
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

  // List all posts (public) with pagination and search
  app.get("/posts", async (req, reply) => {
    const { page, limit, search } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {
      status: "published",
      ...(search && {
        title: { contains: search, mode: "insensitive" },
      }),
    };

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, email: true } },
        },
      }),
      db.post.count({ where }),
    ]);

    return reply.send({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // List my posts (auth required) - MUST be before :id route
  app.get("/posts/me", { preHandler: requireAuth }, async (req, reply) => {
    const { page, limit, search } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {
      userId: req.user.userId,
      ...(search && {
        title: { contains: search, mode: "insensitive" },
      }),
    };

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.post.count({ where }),
    ]);

    return reply.send({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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
