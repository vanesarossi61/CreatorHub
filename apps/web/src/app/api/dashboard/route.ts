// CreatorHub — Dashboard Stats API
// GET /api/dashboard — Role-specific stats and recent activity

import { NextRequest } from "next/server";
import { prisma } from "@creatorhub/database";
import {
  apiSuccess,
  requireAuthUser,
  handleApiError,
} from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthUser();

    if (user.type === "CREATOR" && user.creator) {
      const creator = user.creator;

      // Parallel queries for creator stats
      const [activeDealCount, pendingAppCount, totalEarned, recentActivity] =
        await Promise.all([
          prisma.deal.count({
            where: {
              creatorId: creator.id,
              status: { in: ["ACTIVE", "IN_PROGRESS", "IN_REVIEW"] },
            },
          }),
          prisma.application.count({
            where: { creatorId: creator.id, status: "PENDING" },
          }),
          prisma.creator.findUnique({
            where: { id: creator.id },
            select: { totalEarnings: true, avgRating: true, completedDeals: true },
          }),
          // Recent activity: latest deals + applications
          prisma.$queryRaw`
            (
              SELECT d.id, 'deal_update' AS type,
                c.title AS title,
                CONCAT('Deal ', d.status) AS description,
                d.updated_at AS "createdAt",
                CONCAT('/campaigns/', c.slug) AS link
              FROM deals d
              JOIN campaigns c ON c.id = d.campaign_id
              WHERE d.creator_id = ${creator.id}
              ORDER BY d.updated_at DESC
              LIMIT 5
            )
            UNION ALL
            (
              SELECT a.id, 'application' AS type,
                c.title AS title,
                CONCAT('Aplicacion ', a.status) AS description,
                a.updated_at AS "createdAt",
                CONCAT('/campaigns/', c.slug) AS link
              FROM applications a
              JOIN campaigns c ON c.id = a.campaign_id
              WHERE a.creator_id = ${creator.id}
              ORDER BY a.updated_at DESC
              LIMIT 5
            )
            ORDER BY "createdAt" DESC
            LIMIT 10
          ` as any[],
        ]);

      return apiSuccess({
        role: "CREATOR",
        stats: [
          {
            label: "Deals Activos",
            value: activeDealCount,
            icon: "deals",
          },
          {
            label: "Aplicaciones Pendientes",
            value: pendingAppCount,
            icon: "applications",
          },
          {
            label: "Total Ganado",
            value: `$${Number(totalEarned?.totalEarnings || 0).toLocaleString()}`,
            icon: "earnings",
          },
          {
            label: "Rating Promedio",
            value: Number(totalEarned?.avgRating || 0).toFixed(1),
            icon: "rating",
          },
          {
            label: "Deals Completados",
            value: totalEarned?.completedDeals || 0,
            icon: "completed",
          },
        ],
        recentActivity: (recentActivity || []).map((a: any) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          description: a.description,
          createdAt: a.createdAt,
          link: a.link,
        })),
      });
    }

    if (user.type === "BRAND" && user.brand) {
      const brand = user.brand;

      const [activeCampaignCount, totalApplicants, totalDeals, brandStats, recentActivity] =
        await Promise.all([
          prisma.campaign.count({
            where: { brandId: brand.id, status: "ACTIVE" },
          }),
          prisma.application.count({
            where: {
              campaign: { brandId: brand.id },
              status: "PENDING",
            },
          }),
          prisma.deal.count({
            where: { campaign: { brandId: brand.id } },
          }),
          prisma.brand.findUnique({
            where: { id: brand.id },
            select: { totalSpent: true, avgRating: true, totalReviews: true },
          }),
          prisma.application.findMany({
            where: { campaign: { brandId: brand.id } },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              status: true,
              createdAt: true,
              creator: {
                select: { displayName: true, slug: true },
              },
              campaign: {
                select: { title: true, slug: true },
              },
            },
          }),
        ]);

      return apiSuccess({
        role: "BRAND",
        stats: [
          {
            label: "Campanas Activas",
            value: activeCampaignCount,
            icon: "campaigns",
          },
          {
            label: "Aplicaciones Pendientes",
            value: totalApplicants,
            icon: "applications",
          },
          {
            label: "Total Deals",
            value: totalDeals,
            icon: "deals",
          },
          {
            label: "Total Invertido",
            value: `$${Number(brandStats?.totalSpent || 0).toLocaleString()}`,
            icon: "spent",
          },
          {
            label: "Rating Promedio",
            value: Number(brandStats?.avgRating || 0).toFixed(1),
            icon: "rating",
          },
        ],
        recentActivity: recentActivity.map((a) => ({
          id: a.id,
          type: "new_application",
          title: `${a.creator.displayName} aplico a ${a.campaign.title}`,
          description: `Estado: ${a.status}`,
          createdAt: a.createdAt.toISOString(),
          link: `/campaigns/${a.campaign.slug}`,
        })),
      });
    }

    // Agency or fallback
    return apiSuccess({
      role: user.type,
      stats: [],
      recentActivity: [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
