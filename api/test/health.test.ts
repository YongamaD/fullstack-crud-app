import { test, expect } from "vitest";
import { buildServer } from "../src/server";

test("GET /health returns ok", async () => {
  const app = buildServer();

  const response = await app.inject({
    method: "GET",
    url: "/health",
  });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ status: "ok" });
});