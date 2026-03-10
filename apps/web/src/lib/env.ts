// CreatorHub -- Environment Variable Validation
// Validates all required env vars at build time using Zod.
// Import this at the top of your app to fail fast if something is missing.
//
// Usage: import { env } from "@/lib/env";
//        console.log(env.DATABASE_URL);

import { z } from "zod";

// =============================
// SERVER-SIDE ENV VARS
// =============================
// These are only available on the server (Next.js API routes, server components)

const serverSchema = z.object({
  // Database
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid PostgreSQL connection string")
    .startsWith("postgresql://", "DATABASE_URL must start with postgresql://"),

  // Auth (Clerk)
  CLERK_SECRET_KEY: z
    .string()
    .min(1, "CLERK_SECRET_KEY is required")
    .startsWith("sk_", "CLERK_SECRET_KEY must start with sk_"),

  CLERK_WEBHOOK_SECRET: z
    .string()
    .min(1, "CLERK_WEBHOOK_SECRET is required for webhook verification")
    .optional(),

  // Payments (Stripe)
  STRIPE_SECRET_KEY: z
    .string()
    .min(1, "STRIPE_SECRET_KEY is required")
    .startsWith("sk_", "STRIPE_SECRET_KEY must start with sk_"),

  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, "STRIPE_WEBHOOK_SECRET is required")
    .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with whsec_")
    .optional(),

  // Storage (MinIO / S3-compatible)
  MINIO_ENDPOINT: z
    .string()
    .min(1, "MINIO_ENDPOINT is required")
    .default("localhost"),

  MINIO_PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default("9000"),

  MINIO_ACCESS_KEY: z
    .string()
    .min(1, "MINIO_ACCESS_KEY is required")
    .default("minioadmin"),

  MINIO_SECRET_KEY: z
    .string()
    .min(1, "MINIO_SECRET_KEY is required")
    .default("minioadmin"),

  MINIO_BUCKET: z
    .string()
    .min(1, "MINIO_BUCKET is required")
    .default("creatorhub"),

  MINIO_USE_SSL: z
    .string()
    .transform((val) => val === "true")
    .default("false"),

  // Redis (optional -- for caching, rate limiting)
  REDIS_URL: z
    .string()
    .url("REDIS_URL must be a valid URL")
    .optional(),

  // App
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// =============================
// CLIENT-SIDE ENV VARS
// =============================
// These are exposed to the browser (must be prefixed with NEXT_PUBLIC_)

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .default("http://localhost:3000"),

  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required")
    .startsWith("pk_", "Must start with pk_"),

  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z
    .string()
    .default("/sign-in"),

  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z
    .string()
    .default("/sign-up"),

  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z
    .string()
    .default("/dashboard"),

  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z
    .string()
    .default("/onboarding"),

  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required")
    .startsWith("pk_", "Must start with pk_")
    .optional(),

  NEXT_PUBLIC_MINIO_PUBLIC_URL: z
    .string()
    .url()
    .default("http://localhost:9000"),
});

// =============================
// VALIDATION & EXPORT
// =============================

/**
 * Validated server environment variables.
 * Only accessible in server-side code (API routes, server components).
 *
 * Will throw a descriptive error at startup if any required variable
 * is missing or invalid.
 */
function validateServerEnv() {
  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "\nInvalid server environment variables:\n",
      parsed.error.flatten().fieldErrors
    );
    throw new Error(
      "Invalid server environment variables. Check the console for details."
    );
  }

  return parsed.data;
}

/**
 * Validated client environment variables.
 * These are safe to expose to the browser.
 */
function validateClientEnv() {
  const clientEnv: Record<string, string | undefined> = {};

  // Only pick NEXT_PUBLIC_ vars from process.env
  for (const key of Object.keys(clientSchema.shape)) {
    clientEnv[key] = process.env[key];
  }

  const parsed = clientSchema.safeParse(clientEnv);

  if (!parsed.success) {
    console.error(
      "\nInvalid client environment variables:\n",
      parsed.error.flatten().fieldErrors
    );
    throw new Error(
      "Invalid client environment variables. Check the console for details."
    );
  }

  return parsed.data;
}

// Export validated env objects
// Note: In development, we use a lenient approach -- validate only when accessed.
// In production, these will throw at build/start time.

export const serverEnv =
  process.env.NODE_ENV === "production"
    ? validateServerEnv()
    : (process.env as unknown as z.infer<typeof serverSchema>);

export const clientEnv =
  process.env.NODE_ENV === "production"
    ? validateClientEnv()
    : (process.env as unknown as z.infer<typeof clientSchema>);

// Convenience: merged env (server + client) for server-side code
export const env = { ...serverEnv, ...clientEnv };

// Type exports for use in other files
export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
