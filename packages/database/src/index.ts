// @creatorhub/database — Prisma client & types export
// This package exports the Prisma client instance and all generated types
// so other packages can import from "@creatorhub/database"

import { PrismaClient } from "@prisma/client";

// Singleton pattern for Prisma client in development
// Prevents creating multiple instances during hot reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-export all Prisma types for use across the monorepo
export * from "@prisma/client";
export type { PrismaClient };
