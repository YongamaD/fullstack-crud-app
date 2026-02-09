import { test, expect, describe } from "vitest";
import { buildServer } from "../src/server";

describe("Security Middleware", () => {
  describe("Rate Limiting", () => {
    test("rate limit plugin is registered", async () => {
      const app = buildServer();
      await app.ready();

      // Verify the rate limit plugin is registered by checking the decorator
      expect(app.hasDecorator("rateLimit")).toBe(true);
    });

    test("allows normal requests", async () => {
      const app = buildServer();

      // Make several requests - should all succeed (inject bypasses rate limit)
      for (let i = 0; i < 5; i++) {
        const res = await app.inject({
          method: "GET",
          url: "/health",
        });
        expect(res.statusCode).toBe(200);
      }
    });
  });

  describe("Security Headers (Helmet)", () => {
    test("sets X-Content-Type-Options header", async () => {
      const app = buildServer();

      const res = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    test("sets X-Frame-Options header", async () => {
      const app = buildServer();

      const res = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    });
  });

  describe("CORS", () => {
    test("rejects cross-origin requests when CORS_ORIGIN not set", async () => {
      const app = buildServer();

      const res = await app.inject({
        method: "OPTIONS",
        url: "/health",
        headers: {
          origin: "http://malicious-site.com",
          "access-control-request-method": "GET",
        },
      });

      // Should not include Access-Control-Allow-Origin for unauthorized origins
      expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    });
  });
});
