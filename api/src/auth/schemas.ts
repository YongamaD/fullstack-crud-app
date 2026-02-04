import { z } from "zod";

// Field-level schemas
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .toLowerCase()
  .max(255, "Email must be at most 255 characters");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters"); // bcrypt limit

// Request schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
