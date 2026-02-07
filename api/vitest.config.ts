import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false, // Run test files sequentially to avoid DB conflicts
    env: {
      DATABASE_URL: "postgresql://app:app@localhost:5432/app_test?schema=public",
      JWT_SECRET: "test-secret-key-with-32-characters-minimum",
      NODE_ENV: "test",
      PORT: "3001",
      HOST: "127.0.0.1",
    },
  },
});
