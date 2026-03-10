// CreatorHub — Admin Users API
// GET  /api/admin/users — List all users with filters
// PATCH /api/admin/users — Update user status (activate/deactivate)

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@creatorhub/database";

// Admin email allowlist (env-configured for MVP)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const type = searchParams.get("type"); // CREATOR | BRAND | AGENCY
    const q = searchParams.get("q");
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (type) where.type = type;
    if (isActive !== null && isActive !== "") where.isActive = isActive === "true";
    if (q) {
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          clerkId: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          type: true,
          isActive: true,
          onboardingDone: true,
          createdAt: true,
          creator: {
            select: {
              displayName: true,
              slug: true,
              completedDeals: true,
              totalEarnings: true,
              isVerified: true,
            },
          },
          brand: {
            select: {
              companyName: true,
              slug: true,
              totalSpent: true,
              isVerified: true,
            },
          },
          _count: {
            select: { notifications: true, sentMessages: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: users,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error("[Admin Users GET]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, isActive, isVerified } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    // Update user active status
    if (typeof isActive === "boolean") {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive },
      });
    }

    // Update verified status on creator/brand profile
    if (typeof isVerified === "boolean") {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { type: true },
      });

      if (targetUser?.type === "CREATOR") {
        await prisma.creator.update({
          where: { userId },
          data: { isVerified },
        });
      } else if (targetUser?.type === "BRAND") {
        await prisma.brand.update({
          where: { userId },
          data: { isVerified },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Admin Users PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
