import { test, expect, beforeEach } from "vitest";
import { buildServer } from "../src/server";
import { db } from "../src/db";

beforeEach(async () => {
  // Clean database before each test (posts first due to FK constraint)
  await db.post.deleteMany({});
  await db.user.deleteMany({});
});

test("POST /auth/register with valid data returns 201 and JWT", async () => {
  const app = buildServer();

  const res = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      email: "test@example.com",
      password: "password123",
    },
  });

  expect(res.statusCode).toBe(201);
  const body = res.json();
  expect(body).toHaveProperty("token");
  expect(typeof body.token).toBe("string");
});

test("POST /auth/register with invalid email returns 400", async () => {
  const app = buildServer();

  const res = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      email: "not-an-email",
      password: "password123",
    },
  });

  expect(res.statusCode).toBe(400);
  const body = res.json();
  expect(body.error).toBe("Validation failed");
  expect(body.details).toBeDefined();
});

test("POST /auth/register with short password returns 400", async () => {
  const app = buildServer();

  const res = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      email: "test@example.com",
      password: "short",
    },
  });

  expect(res.statusCode).toBe(400);
  const body = res.json();
  expect(body.error).toBe("Validation failed");
  expect(body.details).toBeDefined();
  expect(body.details[0].message).toContain("at least 8 characters");
});

test("POST /auth/register with password >72 chars returns 400", async () => {
  const app = buildServer();

  const res = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      email: "test@example.com",
      password: "a".repeat(73), // bcrypt max is 72
    },
  });

  expect(res.statusCode).toBe(400);
  const body = res.json();
  expect(body.error).toBe("Validation failed");
  expect(body.details[0].message).toContain("at most 72 characters");
});

test("POST /auth/register with duplicate email returns 409", async () => {
  const app = buildServer();

  // Create first user
  await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      email: "test@example.com",
      password: "password123",
    },
  });

  // Try to create duplicate
  const res = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      email: "test@example.com",
      password: "password456",
    },
  });

  expect(res.statusCode).toBe(409);
  const body = res.json();
  expect(body.error).toBe("Email already registered");
});

test("POST /auth/login with valid credentials returns 200 and JWT", async () => {
  const app = buildServer();

  // Register user
  await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      email: "test@example.com",
      password: "password123",
    },
  });

  // Login
  const res = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: {
      email: "test@example.com",
      password: "password123",
    },
  });

  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body).toHaveProperty("token");
  expect(typeof body.token).toBe("string");
});

test("POST /auth/login with wrong password returns 401", async () => {
  const app = buildServer();

  // Register user
  await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      email: "test@example.com",
      password: "correct-password",
    },
  });

  // Login with wrong password
  const res = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: {
      email: "test@example.com",
      password: "wrong-password",
    },
  });

  expect(res.statusCode).toBe(401);
  const body = res.json();
  expect(body.error).toBe("Invalid credentials");
});

test("POST /auth/login with non-existent email returns 401", async () => {
  const app = buildServer();

  const res = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: {
      email: "nonexistent@example.com",
      password: "password123",
    },
  });

  expect(res.statusCode).toBe(401);
  const body = res.json();
  expect(body.error).toBe("Invalid credentials");
});

test("POST /auth/login with invalid email returns 400", async () => {
  const app = buildServer();

  const res = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: {
      email: "not-an-email",
      password: "password123",
    },
  });

  expect(res.statusCode).toBe(400);
  const body = res.json();
  expect(body.error).toBe("Validation failed");
});

test("Email is lowercased on registration", async () => {
  const app = buildServer();

  const res = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      email: "TEST@EXAMPLE.COM",
      password: "password123",
    },
  });

  expect(res.statusCode).toBe(201);

  // Should be able to login with lowercase
  const loginRes = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: {
      email: "test@example.com",
      password: "password123",
    },
  });

  expect(loginRes.statusCode).toBe(200);
});

test("GET /auth/me with valid token returns user info", async () => {
  const app = buildServer();

  // Register and get token
  const registerRes = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      email: "test@example.com",
      password: "password123",
    },
  });

  const { token } = registerRes.json();

  // Get user info
  const res = await app.inject({
    method: "GET",
    url: "/auth/me",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.user).toBeDefined();
  expect(body.user.email).toBe("test@example.com");
  expect(body.user.id).toBeDefined();
  expect(body.user.createdAt).toBeDefined();
  expect(body.user.password).toBeUndefined(); // Should not expose password
});

test("GET /auth/me without token returns 401", async () => {
  const app = buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/auth/me",
  });

  expect(res.statusCode).toBe(401);
  const body = res.json();
  expect(body.error).toBe("Missing or invalid authorization header");
});

test("GET /auth/me with invalid token returns 401", async () => {
  const app = buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/auth/me",
    headers: {
      authorization: "Bearer invalid-token",
    },
  });

  expect(res.statusCode).toBe(401);
  const body = res.json();
  expect(body.error).toBe("Invalid token");
});

test("GET /auth/me with malformed authorization header returns 401", async () => {
  const app = buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/auth/me",
    headers: {
      authorization: "NotBearer token",
    },
  });

  expect(res.statusCode).toBe(401);
  const body = res.json();
  expect(body.error).toBe("Missing or invalid authorization header");
});
