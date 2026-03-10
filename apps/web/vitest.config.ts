// CreatorHub — Vitest Configuration
// Unit testing setup for API routes, validations, and utilities.

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/__tests__/**/*.test.ts", "src/__tests__/**/*.test.tsx"],
    exclude: ["node_modules", ".next", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/lib/**", "src/app/api/**"],
      exclude: ["src/__tests__/**", "node_modules"],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@creatorhub/database": path.resolve(__dirname, "../../packages/database/src"),
      "@creatorhub/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
});
