import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const updatePostSchema = z.object({
  title: z.string().min(1, "Title is required").max(255).optional(),
  content: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export const postIdSchema = z.object({
  id: z.string().cuid(),
});
