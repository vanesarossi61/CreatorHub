// CreatorHub -- Auth Helpers
// Server-side utilities for authentication and authorization.
// Uses Clerk's Next.js server SDK + Prisma for DB lookups.

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@creatorhub/database";
import { redirect } from "next/navigation";
import type { UserType } from "@prisma/client";

// =============================================
// TYPES
// =============================================

export interface AuthUser {
  clerkId: string;
  dbId: string;
  email: string;
  name: string;
  imageUrl: string | null;
  userType: UserType;
  onboarded: boolean;
}

// =============================================
// GET CURRENT USER (with DB record)
// =============================================

/**
 * Get the currently authenticated user with their DB record.
 * Returns null if not authenticated or DB record not found.
 * Use this in Server Components and Route Handlers.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { userId } = await auth();

  if (!userId) return null;

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      imageUrl: true,
      userType: true,
      onboarded: true,
    },
  });

  if (!dbUser) return null;

  return {
    clerkId: dbUser.clerkId,
    dbId: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    imageUrl: dbUser.imageUrl,
    userType: dbUser.userType,
    onboarded: dbUser.onboarded,
  };
}

// =============================================
// REQUIRE AUTH (redirect if not authenticated)
// =============================================

/**
 * Require authentication. Redirects to sign-in if not logged in.
 * Use in Server Components that must be protected.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

// =============================================
// REQUIRE ROLE (authorization check)
// =============================================

/**
 * Require a specific user role. Redirects to dashboard if wrong role.
 * Example: const user = await requireRole("BRAND");
 */
export async function requireRole(
  ...allowedRoles: UserType[]
): Promise<AuthUser> {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.userType)) {
    redirect("/dashboard");
  }

  return user;
}

// =============================================
// REQUIRE ONBOARDED
// =============================================

/**
 * Require that the user has completed onboarding.
 * Redirects to /onboarding if not completed.
 */
export async function requireOnboarded(): Promise<AuthUser> {
  const user = await requireAuth();

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  return user;
}

// =============================================
// API AUTH HELPER (for Route Handlers)
// =============================================

/**
 * Get auth user for API routes. Returns null instead of redirecting.
 * Use in Route Handlers (app/api/...) where you want to return JSON errors.
 *
 * Example:
 *   const user = await getApiUser();
 *   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 */
export async function getApiUser(): Promise<AuthUser | null> {
  return getCurrentUser();
}

/**
 * Check if the current user owns a resource or is an admin.
 * Useful for authorization in API routes.
 */
export async function canAccessResource(
  resourceOwnerId: string
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  // User owns the resource
  if (user.dbId === resourceOwnerId) return true;

  // TODO (Fase 5): Add admin role check
  // if (user.userType === "ADMIN") return true;

  return false;
}

// =============================================
// SYNC CLERK USER TO DB
// =============================================

/**
 * Create or update a user record in the DB from Clerk data.
 * Called from the onboarding API route and Clerk webhook.
 */
export async function syncClerkUserToDb(params: {
  clerkId: string;
  email: string;
  name: string;
  imageUrl?: string | null;
  userType?: UserType;
}) {
  const { clerkId, email, name, imageUrl, userType } = params;

  return prisma.user.upsert({
    where: { clerkId },
    update: {
      email,
      name,
      imageUrl: imageUrl ?? null,
      ...(userType && { userType }),
    },
    create: {
      clerkId,
      email,
      name,
      imageUrl: imageUrl ?? null,
      userType: userType ?? "CREATOR",
      onboarded: false,
    },
  });
}
