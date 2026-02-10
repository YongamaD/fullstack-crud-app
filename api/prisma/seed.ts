import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

const posts = [
  {
    title: "Getting Started with React 19",
    content: "React 19 introduces exciting new features including the React Compiler, Server Components improvements, and enhanced concurrent rendering. In this post, we'll explore how to leverage these features in your applications.\n\nThe new use() hook allows you to read resources like promises and contexts directly, simplifying data fetching patterns significantly.",
    status: "published",
  },
  {
    title: "Building REST APIs with Fastify",
    content: "Fastify is a high-performance web framework for Node.js that's known for its speed and low overhead. It provides a great developer experience with TypeScript support out of the box.\n\nIn this tutorial, we'll build a complete REST API with authentication, validation, and error handling.",
    status: "published",
  },
  {
    title: "Understanding TypeScript Generics",
    content: "Generics are one of TypeScript's most powerful features. They allow you to write flexible, reusable code while maintaining type safety.\n\nLet's explore how to use generics in functions, classes, and interfaces with practical examples.",
    status: "published",
  },
  {
    title: "Docker for Development",
    content: "Docker containers provide consistent development environments across teams. Learn how to containerize your Node.js applications and set up docker-compose for local development.\n\nWe'll cover multi-stage builds, volume mounts, and networking between services.",
    status: "published",
  },
  {
    title: "PostgreSQL Performance Tips",
    content: "Optimize your PostgreSQL database with proper indexing strategies, query analysis, and configuration tuning. These tips can dramatically improve your application's performance.\n\nWe'll use EXPLAIN ANALYZE to understand query execution plans.",
    status: "published",
  },
  {
    title: "Authentication with JWT",
    content: "JSON Web Tokens provide a stateless authentication mechanism for modern web applications. Learn how to implement secure JWT authentication with refresh tokens.\n\nWe'll cover token storage, expiration handling, and security best practices.",
    status: "published",
  },
  {
    title: "CSS Grid Layout Mastery",
    content: "CSS Grid is a powerful layout system that makes complex layouts simple. From basic grids to advanced responsive designs, this guide covers it all.\n\nLearn about grid-template-areas, auto-fit, minmax(), and more.",
    status: "published",
  },
  {
    title: "Testing React Components",
    content: "Writing effective tests for React components ensures your application works correctly. We'll explore React Testing Library patterns and best practices.\n\nLearn how to test user interactions, async operations, and component state.",
    status: "published",
  },
  {
    title: "Git Workflow Best Practices",
    content: "A good Git workflow improves team collaboration and code quality. Learn about branching strategies, commit conventions, and pull request reviews.\n\nWe'll cover trunk-based development vs. GitFlow and when to use each.",
    status: "published",
  },
  {
    title: "Node.js Error Handling",
    content: "Proper error handling is crucial for building reliable applications. Learn how to handle sync and async errors, create custom error classes, and implement global error handlers.\n\nWe'll also cover logging and monitoring strategies.",
    status: "published",
  },
  {
    title: "Responsive Design Patterns",
    content: "Build websites that work beautifully on all devices. From mobile-first approaches to flexible images and fluid typography.\n\nLearn about container queries, the new CSS units, and modern breakpoint strategies.",
    status: "published",
  },
  {
    title: "API Rate Limiting Strategies",
    content: "Protect your API from abuse with effective rate limiting. We'll explore token bucket algorithms, sliding windows, and distributed rate limiting with Redis.\n\nLearn how to balance security with user experience.",
    status: "published",
  },
  {
    title: "Draft: Upcoming Features",
    content: "This is a draft post about upcoming features we're working on. Not ready for publication yet.",
    status: "draft",
  },
  {
    title: "Draft: Performance Optimization",
    content: "Notes on various performance optimization techniques. Still gathering research.",
    status: "draft",
  },
  {
    title: "Prisma ORM Deep Dive",
    content: "Prisma provides a type-safe database client for TypeScript and Node.js. Learn about schema design, migrations, and advanced query patterns.\n\nWe'll explore relations, transactions, and raw SQL when needed.",
    status: "published",
  },
];

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clear existing data
  await db.post.deleteMany({});
  await db.user.deleteMany({});

  // Create demo user
  const hashedPassword = await hashPassword("password123");

  const demoUser = await db.user.create({
    data: {
      email: "demo@example.com",
      password: hashedPassword,
    },
  });

  console.log(`✅ Created user: ${demoUser.email}`);

  // Create second user
  const secondUser = await db.user.create({
    data: {
      email: "jane@example.com",
      password: hashedPassword,
    },
  });

  console.log(`✅ Created user: ${secondUser.email}`);

  // Create posts for demo user
  for (const post of posts.slice(0, 10)) {
    await db.post.create({
      data: {
        ...post,
        userId: demoUser.id,
      },
    });
  }

  // Create posts for second user
  for (const post of posts.slice(10)) {
    await db.post.create({
      data: {
        ...post,
        userId: secondUser.id,
      },
    });
  }

  const totalPosts = await db.post.count();
  const publishedPosts = await db.post.count({ where: { status: "published" } });

  console.log(`\n✅ Created ${totalPosts} posts (${publishedPosts} published)`);
  console.log("\n📝 Demo accounts:");
  console.log("   Email: demo@example.com");
  console.log("   Password: password123");
  console.log("\n   Email: jane@example.com");
  console.log("   Password: password123");
  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
