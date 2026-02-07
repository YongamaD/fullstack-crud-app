import { test, expect, beforeEach } from "vitest";
import { buildServer } from "../src/server";
import { db } from "../src/db";

let token: string;
let userId: string;

beforeEach(async () => {
  // Clean database
  await db.post.deleteMany({});
  await db.user.deleteMany({});

  // Create test user and get token
  const app = buildServer();
  const res = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      email: "test@example.com",
      password: "password123",
    },
  });
  token = res.json().token;

  const user = await db.user.findUnique({ where: { email: "test@example.com" } });
  userId = user!.id;
});

test("POST /posts creates a post", async () => {
  const app = buildServer();

  const res = await app.inject({
    method: "POST",
    url: "/posts",
    headers: { authorization: `Bearer ${token}` },
    payload: {
      title: "My First Post",
      content: "Hello world!",
    },
  });

  expect(res.statusCode).toBe(201);
  const body = res.json();
  expect(body.post.title).toBe("My First Post");
  expect(body.post.content).toBe("Hello world!");
  expect(body.post.status).toBe("draft");
  expect(body.post.userId).toBe(userId);
});

test("POST /posts without auth returns 401", async () => {
  const app = buildServer();

  const res = await app.inject({
    method: "POST",
    url: "/posts",
    payload: { title: "Test" },
  });

  expect(res.statusCode).toBe(401);
});

test("POST /posts with invalid data returns 400", async () => {
  const app = buildServer();

  const res = await app.inject({
    method: "POST",
    url: "/posts",
    headers: { authorization: `Bearer ${token}` },
    payload: { title: "" }, // Empty title
  });

  expect(res.statusCode).toBe(400);
});

test("GET /posts returns published posts only", async () => {
  const app = buildServer();

  // Create draft and published posts
  await db.post.createMany({
    data: [
      { title: "Draft Post", status: "draft", userId },
      { title: "Published Post", status: "published", userId },
    ],
  });

  const res = await app.inject({
    method: "GET",
    url: "/posts",
  });

  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.posts).toHaveLength(1);
  expect(body.posts[0].title).toBe("Published Post");
});

test("GET /posts/:id returns a single post", async () => {
  const app = buildServer();

  const post = await db.post.create({
    data: { title: "Test Post", userId },
  });

  const res = await app.inject({
    method: "GET",
    url: `/posts/${post.id}`,
  });

  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.post.title).toBe("Test Post");
});

test("GET /posts/:id with invalid id returns 400", async () => {
  const app = buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/posts/invalid-id",
  });

  expect(res.statusCode).toBe(400);
});

test("GET /posts/:id with non-existent id returns 404", async () => {
  const app = buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/posts/clxxxxxxxxxxxxxxxxxxxxxxxxx", // Valid cuid format but doesn't exist
  });

  expect(res.statusCode).toBe(404);
});

test("PUT /posts/:id updates a post", async () => {
  const app = buildServer();

  const post = await db.post.create({
    data: { title: "Original Title", userId },
  });

  const res = await app.inject({
    method: "PUT",
    url: `/posts/${post.id}`,
    headers: { authorization: `Bearer ${token}` },
    payload: { title: "Updated Title" },
  });

  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.post.title).toBe("Updated Title");
});

test("PUT /posts/:id on another user's post returns 403", async () => {
  const app = buildServer();

  // Create another user and their post
  const otherUser = await db.user.create({
    data: { email: "other@example.com", password: "hashed" },
  });
  const post = await db.post.create({
    data: { title: "Other's Post", userId: otherUser.id },
  });

  const res = await app.inject({
    method: "PUT",
    url: `/posts/${post.id}`,
    headers: { authorization: `Bearer ${token}` },
    payload: { title: "Hacked!" },
  });

  expect(res.statusCode).toBe(403);
});

test("DELETE /posts/:id deletes a post", async () => {
  const app = buildServer();

  const post = await db.post.create({
    data: { title: "To Delete", userId },
  });

  const res = await app.inject({
    method: "DELETE",
    url: `/posts/${post.id}`,
    headers: { authorization: `Bearer ${token}` },
  });

  expect(res.statusCode).toBe(204);

  // Verify deleted
  const deleted = await db.post.findUnique({ where: { id: post.id } });
  expect(deleted).toBeNull();
});

test("DELETE /posts/:id on another user's post returns 403", async () => {
  const app = buildServer();

  const otherUser = await db.user.create({
    data: { email: "other2@example.com", password: "hashed" },
  });
  const post = await db.post.create({
    data: { title: "Other's Post", userId: otherUser.id },
  });

  const res = await app.inject({
    method: "DELETE",
    url: `/posts/${post.id}`,
    headers: { authorization: `Bearer ${token}` },
  });

  expect(res.statusCode).toBe(403);
});

test("GET /posts/me returns user's own posts", async () => {
  const app = buildServer();

  // Create posts for test user
  await db.post.createMany({
    data: [
      { title: "My Post 1", userId },
      { title: "My Post 2", userId },
    ],
  });

  // Create post for another user
  const other = await db.user.create({
    data: { email: "other3@example.com", password: "hashed" },
  });
  await db.post.create({ data: { title: "Other Post", userId: other.id } });

  const res = await app.inject({
    method: "GET",
    url: "/posts/me",
    headers: { authorization: `Bearer ${token}` },
  });

  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.posts).toHaveLength(2);
});
