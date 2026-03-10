// CreatorHub -- Clerk Auth Middleware
// Protects routes and handles auth redirects.
// Docs: https://clerk.com/docs/references/nextjs/clerk-middleware

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes -- accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/uploadthing(.*)",
  "/explore", // Public browsing of creators
]);

// Onboarding route -- accessible only when authenticated but not onboarded
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

// API routes that need auth
const isApiRoute = createRouteMatcher(["/api(?!/webhooks|/uploadthing)(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Allow public routes without any checks
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Not authenticated? Redirect to sign-in
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Check if user has completed onboarding
  // We store this in Clerk's publicMetadata via the onboarding flow
  const hasOnboarded = (sessionClaims?.metadata as Record<string, unknown>)?.onboarded === true;

  // User is authenticated but hasn't onboarded -- force onboarding
  if (!hasOnboarded && !isOnboardingRoute(req)) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // User has onboarded but is trying to access onboarding again -- redirect to dashboard
  if (hasOnboarded && isOnboardingRoute(req)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // API routes -- return 401 JSON instead of redirect (already checked userId above)
  if (isApiRoute(req)) {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  // Match all routes except static files and _next internals
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
