import { test, expect, describe } from "vitest";
import { z } from "zod";

// Recreate the config schema for testing (matches src/config.ts)
const configSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

describe("Config Validation", () => {
  const validEnv = {
    DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
    JWT_SECRET: "this-is-a-valid-secret-with-32-chars",
  };

  describe("JWT_SECRET", () => {
    test("rejects missing JWT_SECRET", () => {
      const env = { DATABASE_URL: validEnv.DATABASE_URL };

      const result = configSchema.safeParse(env);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("JWT_SECRET");
      }
    });

    test("rejects JWT_SECRET shorter than 32 characters", () => {
      const env = {
        ...validEnv,
        JWT_SECRET: "too-short",
      };

      const result = configSchema.safeParse(env);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("32 characters");
      }
    });

    test("accepts JWT_SECRET with exactly 32 characters", () => {
      const env = {
        ...validEnv,
        JWT_SECRET: "12345678901234567890123456789012", // 32 chars
      };

      const result = configSchema.safeParse(env);

      expect(result.success).toBe(true);
    });
  });

  describe("DATABASE_URL", () => {
    test("rejects missing DATABASE_URL", () => {
      const env = { JWT_SECRET: validEnv.JWT_SECRET };

      const result = configSchema.safeParse(env);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("DATABASE_URL");
      }
    });

    test("rejects invalid DATABASE_URL", () => {
      const env = {
        ...validEnv,
        DATABASE_URL: "not-a-valid-url",
      };

      const result = configSchema.safeParse(env);

      expect(result.success).toBe(false);
    });
  });

  describe("PORT", () => {
    test("coerces PORT string to number", () => {
      const env = {
        ...validEnv,
        PORT: "8080",
      };

      const result = configSchema.safeParse(env);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(8080);
        expect(typeof result.data.PORT).toBe("number");
      }
    });

    test("defaults PORT to 3000 when not provided", () => {
      const result = configSchema.safeParse(validEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(3000);
      }
    });
  });

  describe("HOST", () => {
    test("defaults HOST to 0.0.0.0 when not provided", () => {
      const result = configSchema.safeParse(validEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.HOST).toBe("0.0.0.0");
      }
    });

    test("accepts custom HOST", () => {
      const env = {
        ...validEnv,
        HOST: "127.0.0.1",
      };

      const result = configSchema.safeParse(env);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.HOST).toBe("127.0.0.1");
      }
    });
  });

  describe("NODE_ENV", () => {
    test("accepts valid NODE_ENV values", () => {
      for (const nodeEnv of ["development", "test", "production"]) {
        const env = { ...validEnv, NODE_ENV: nodeEnv };
        const result = configSchema.safeParse(env);
        expect(result.success).toBe(true);
      }
    });

    test("rejects invalid NODE_ENV", () => {
      const env = {
        ...validEnv,
        NODE_ENV: "invalid",
      };

      const result = configSchema.safeParse(env);

      expect(result.success).toBe(false);
    });

    test("defaults NODE_ENV to development", () => {
      const result = configSchema.safeParse(validEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe("development");
      }
    });
  });

  describe("CORS_ORIGIN", () => {
    test("CORS_ORIGIN is optional", () => {
      const result = configSchema.safeParse(validEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toBeUndefined();
      }
    });

    test("accepts CORS_ORIGIN when provided", () => {
      const env = {
        ...validEnv,
        CORS_ORIGIN: "http://localhost:5173",
      };

      const result = configSchema.safeParse(env);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toBe("http://localhost:5173");
      }
    });
  });
});
