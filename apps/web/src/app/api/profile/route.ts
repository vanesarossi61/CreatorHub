// CreatorHub — Profile API
// GET  /api/profile — Get current user's full profile
// PUT  /api/profile — Update profile (creator or brand fields)

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@creatorhub/database";
import {
  apiSuccess,
  requireAuthUser,
  handleApiError,
  parseBody,
} from "@/lib/api-helpers";

// ----------------------------------------
// GET /api/profile
// ----------------------------------------
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthUser();

    const fullUser = await prisma.user.findUnique({
      where: { id: user.dbId },
      include: {
        creator: {
          include: {
            socialAccounts: { orderBy: { connectedAt: "desc" } },
            portfolioItems: { orderBy: { sortOrder: "asc" } },
            skills: { include: { skill: true } },
          },
        },
        brand: true,
        agency: true,
      },
    });

    if (!fullUser) {
      return new Response(JSON.stringify({ success: false, error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return apiSuccess(fullUser);
  } catch (error) {
    return handleApiError(error);
  }
}

// ----------------------------------------
// PUT /api/profile — Update
// ----------------------------------------

const updateCreatorSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  country: z.string().length(2).optional(),
  city: z.string().max(100).optional(),
  languages: z.array(z.string()).optional(),
  website: z.string().url().optional().or(z.literal("")),
  hourlyRateMin: z.number().min(0).optional(),
  hourlyRateMax: z.number().min(0).optional(),
  isAvailable: z.boolean().optional(),
  category: z.string().optional(),
});

const updateBrandSchema = z.object({
  companyName: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  website: z.string().url().optional().or(z.literal("")),
  industry: z.string().max(50).optional(),
  companySize: z.enum(["SOLO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]).optional(),
  country: z.string().length(2).optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const rawBody = await req.json();

    if (user.type === "CREATOR" && user.creator) {
      const data = updateCreatorSchema.parse(rawBody);

      // Clean empty strings
      const cleanData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          cleanData[key] = value === "" ? null : value;
        }
      }

      const updated = await prisma.creator.update({
        where: { id: user.creator.id },
        data: cleanData as any,
        include: {
          socialAccounts: { orderBy: { connectedAt: "desc" } },
          portfolioItems: { orderBy: { sortOrder: "asc" } },
          skills: { include: { skill: true } },
        },
      });

      const fullUser = await prisma.user.findUnique({
        where: { id: user.dbId },
        include: {
          creator: {
            include: {
              socialAccounts: true,
              portfolioItems: { orderBy: { sortOrder: "asc" } },
              skills: { include: { skill: true } },
            },
          },
          brand: true,
        },
      });

      return apiSuccess(fullUser);
    }

    if (user.type === "BRAND" && user.brand) {
      const data = updateBrandSchema.parse(rawBody);

      const cleanData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          cleanData[key] = value === "" ? null : value;
        }
      }

      await prisma.brand.update({
        where: { id: user.brand.id },
        data: cleanData as any,
      });

      const fullUser = await prisma.user.findUnique({
        where: { id: user.dbId },
        include: { creator: true, brand: true },
      });

      return apiSuccess(fullUser);
    }

    return new Response(
      JSON.stringify({ success: false, error: "Profile update not supported for this user type" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
