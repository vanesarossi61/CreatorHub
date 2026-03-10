// CreatorHub — Deals API
// GET /api/deals — List deals for authenticated user (creator or brand)

import { NextRequest } from "next/server";
import { prisma } from "@creatorhub/database";
import {
  apiError,
  requireAuthUser,
  getPagination,
  paginatedResponse,
  handleApiError,
} from "@/lib/api-helpers";

// ----------------------------------------
// GET /api/deals
// Creators see their deals. Brands see deals from their campaigns.
// ----------------------------------------
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const { page, pageSize, skip } = getPagination(req);
    const url = new URL(req.url);

    const status = url.searchParams.get("status");
    const campaignId = url.searchParams.get("campaignId");

    let where: any = {};

    if (user.type === "CREATOR" && user.creator) {
      where.creatorId = user.creator.id;
    } else if (user.type === "BRAND" && user.brand) {
      where.campaign = { brandId: user.brand.id };
    } else {
      return apiError("Invalid user type for deals", 403);
    }

    if (status) where.status = status;
    if (campaignId) where.campaignId = campaignId;

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          campaign: {
            select: {
              id: true,
              title: true,
              slug: true,
              dealType: true,
              brand: {
                select: {
                  id: true,
                  companyName: true,
                  slug: true,
                  logoKey: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              displayName: true,
              slug: true,
              avatarKey: true,
              isVerified: true,
            },
          },
          _count: {
            select: {
              deliverables: true,
              milestones: true,
              payouts: true,
            },
          },
        },
      }),
      prisma.deal.count({ where }),
    ]);

    return paginatedResponse(deals, total, { page, pageSize, skip });
  } catch (error) {
    return handleApiError(error);
  }
}
