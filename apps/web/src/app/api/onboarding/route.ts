// CreatorHub -- Onboarding API Route
// Called from the onboarding page after the user selects their role.
// Updates the DB record and sets Clerk publicMetadata.onboarded = true.

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@creatorhub/database";
import { z } from "zod";
import type { UserType } from "@prisma/client";

const onboardingSchema = z.object({
  role: z.enum(["CREATOR", "BRAND", "AGENCY"]),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await req.json();
    const result = onboardingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Rol invalido", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { role } = result.data;

    // Update the user record in the DB
    const dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        userType: role as UserType,
        onboarded: true,
      },
      create: {
        clerkId: userId,
        email: "", // Will be filled by webhook
        name: "",  // Will be filled by webhook
        userType: role as UserType,
        onboarded: true,
      },
    });

    // Create the role-specific profile
    if (role === "CREATOR") {
      await prisma.creator.upsert({
        where: { userId: dbUser.id },
        update: {},
        create: {
          userId: dbUser.id,
          displayName: dbUser.name || "Nuevo Creador",
          bio: "",
          category: "OTHER",
        },
      });
    } else if (role === "BRAND") {
      await prisma.brand.upsert({
        where: { userId: dbUser.id },
        update: {},
        create: {
          userId: dbUser.id,
          companyName: "Mi Empresa",
          industry: "",
        },
      });
    } else if (role === "AGENCY") {
      await prisma.agency.upsert({
        where: { userId: dbUser.id },
        update: {},
        create: {
          userId: dbUser.id,
          agencyName: "Mi Agencia",
          description: "",
        },
      });
    }

    // Set Clerk publicMetadata so the middleware knows the user is onboarded
    const clerk = await clerkClient();
    await clerk.users.updateUser(userId, {
      publicMetadata: {
        onboarded: true,
        role,
        dbId: dbUser.id,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        userType: role,
        onboarded: true,
      },
    });
  } catch (error) {
    console.error("[Onboarding API] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
