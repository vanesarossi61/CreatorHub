// CreatorHub — Admin Stats API
// GET /api/admin/stats — Platform-wide statistics for admin dashboard

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@creatorhub/database";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Run all queries in parallel
    const [
      totalUsers,
      totalCreators,
      totalBrands,
      totalCampaigns,
      activeCampaigns,
      totalDeals,
      completedDeals,
      totalApplications,
      revenueData,
      recentUsers,
      recentDeals,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.creator.count(),
      prisma.brand.count(),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: "ACTIVE" } }),
      prisma.deal.count(),
      prisma.deal.count({ where: { status: "COMPLETED" } }),
      prisma.application.count(),
      prisma.payout.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          type: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.deal.findMany({
        select: {
          id: true,
          status: true,
          agreedRate: true,
          createdAt: true,
          campaign: { select: { title: true } },
          creator: { select: { displayName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const totalRevenue = revenueData._sum.amount?.toNumber() || 0;
    const platformRevenue = totalRevenue * 0.12; // 12% platform fee

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalCreators,
          totalBrands,
          totalCampaigns,
          activeCampaigns,
          totalDeals,
          completedDeals,
          totalApplications,
          totalRevenue,
          platformRevenue,
          conversionRate: totalApplications > 0
            ? ((completedDeals / totalApplications) * 100).toFixed(1)
            : "0",
        },
        recentUsers,
        recentDeals,
      },
    });
  } catch (error: any) {
    console.error("[Admin Stats GET]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
