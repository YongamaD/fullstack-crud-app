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

// Pagination tests
test("GET /posts returns pagination metadata", async () => {
  const app = buildServer();

  // Create 15 published posts
  await db.post.createMany({
    data: Array.from({ length: 15 }, (_, i) => ({
      title: `Post ${i + 1}`,
      status: "published",
      userId,
    })),
  });

  const res = await app.inject({
    method: "GET",
    url: "/posts",
  });

  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.pagination).toBeDefined();
  expect(body.pagination.page).toBe(1);
  expect(body.pagination.limit).toBe(10);
  expect(body.pagination.total).toBe(15);
  expect(body.pagination.totalPages).toBe(2);
  expect(body.posts).toHaveLength(10);
});

test("GET /posts with page param returns correct page", async () => {
  const app = buildServer();

  await db.post.createMany({
    data: Array.from({ length: 15 }, (_, i) => ({
      title: `Post ${i + 1}`,
      status: "published",
      userId,
    })),
  });

  const res = await app.inject({
    method: "GET",
    url: "/posts?page=2",
  });

  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.pagination.page).toBe(2);
  expect(body.posts).toHaveLength(5);
});

test("GET /posts with limit param returns correct number", async () => {
  const app = buildServer();

  await db.post.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      title: `Post ${i + 1}`,
      status: "published",
      userId,
    })),
  });

  const res = await app.inject({
    method: "GET",
    url: "/posts?limit=5",
  });

  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.pagination.limit).toBe(5);
  expect(body.pagination.totalPages).toBe(2);
  expect(body.posts).toHaveLength(5);
});

test("GET /posts with search filters by title", async () => {
  const app = buildServer();

  await db.post.createMany({
    data: [
      { title: "JavaScript Tutorial", status: "published", userId },
      { title: "TypeScript Guide", status: "published", userId },
      { title: "Python Basics", status: "published", userId },
    ],
  });

  const res = await app.inject({
    method: "GET",
    url: "/posts?search=script",
  });

  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.posts).toHaveLength(2);
  expect(body.posts.every((p: { title: string }) => p.title.toLowerCase().includes("script"))).toBe(true);
});

test("GET /posts search is case-insensitive", async () => {
  const app = buildServer();

  await db.post.create({
    data: { title: "UPPERCASE TITLE", status: "published", userId },
  });

  const res = await app.inject({
    method: "GET",
    url: "/posts?search=uppercase",
  });

  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.posts).toHaveLength(1);
});

test("GET /posts/me with pagination", async () => {
  const app = buildServer();

  await db.post.createMany({
    data: Array.from({ length: 12 }, (_, i) => ({
      title: `My Post ${i + 1}`,
      userId,
    })),
  });

  const res = await app.inject({
    method: "GET",
    url: "/posts/me?page=2&limit=5",
    headers: { authorization: `Bearer ${token}` },
  });

  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.pagination.page).toBe(2);
  expect(body.pagination.limit).toBe(5);
  expect(body.pagination.total).toBe(12);
  expect(body.posts).toHaveLength(5);
});

test("GET /posts/me with search", async () => {
  const app = buildServer();

  await db.post.createMany({
    data: [
      { title: "React Tutorial", userId },
      { title: "Vue Guide", userId },
      { title: "React Hooks", userId },
    ],
  });

  const res = await app.inject({
    method: "GET",
    url: "/posts/me?search=react",
    headers: { authorization: `Bearer ${token}` },
  });

  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.posts).toHaveLength(2);
});
