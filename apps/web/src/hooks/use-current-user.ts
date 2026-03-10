"use client";

import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";

export type UserRole = "CREATOR" | "BRAND" | "AGENCY";

export interface CurrentUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string;
  imageUrl: string;
  role: UserRole;
  isCreator: boolean;
  isBrand: boolean;
  isAgency: boolean;
  isLoaded: boolean;
}

/**
 * Hook to get the current authenticated user with role info.
 * Reads role from Clerk's unsafeMetadata (set during onboarding).
 */
export function useCurrentUser(): CurrentUser | null {
  const { user, isLoaded } = useUser();

  return useMemo(() => {
    if (!isLoaded || !user) return null;

    const role = (user.unsafeMetadata?.role as UserRole) || "CREATOR";

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.primaryEmailAddress?.emailAddress || "",
      imageUrl: user.imageUrl,
      role,
      isCreator: role === "CREATOR",
      isBrand: role === "BRAND",
      isAgency: role === "AGENCY",
      isLoaded,
    };
  }, [user, isLoaded]);
}
