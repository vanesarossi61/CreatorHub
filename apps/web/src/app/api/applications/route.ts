// CreatorHub — Applications API
// GET  /api/applications — List applications (filtered by role)
// POST /api/applications — Apply to a campaign (creators only)

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@creatorhub/database";
import { applicationCreateSchema } from "@creatorhub/shared";
import {
  apiSuccess,
  apiCreated,
  apiError,
  requireAuthUser,
  requireCreator,
  requireBrand,
  getPagination,
  paginatedResponse,
  parseBody,
  handleApiError,
  ApiNotFoundError,
} from "@/lib/api-helpers";

// ----------------------------------------
// GET /api/applications
// Creators see their own applications.
// Brands see applications to their campaigns.
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
      // Creators see their own applications
      where.creatorId = user.creator.id;
    } else if (user.type === "BRAND" && user.brand) {
      // Brands see applications to their campaigns
      where.campaign = { brandId: user.brand.id };
    } else {
      return apiError("Invalid user type for applications", 403);
    }

    if (status) where.status = status;
    if (campaignId) where.campaignId = campaignId;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
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
              status: true,
              budget: true,
              dealType: true,
              brand: {
                select: { id: true, companyName: true, slug: true, logoKey: true },
              },
            },
          },
          creator: {
            select: {
              id: true,
              displayName: true,
              slug: true,
              avatarKey: true,
              category: true,
              avgRating: true,
              completedDeals: true,
              isVerified: true,
            },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return paginatedResponse(applications, total, { page, pageSize, skip });
  } catch (error) {
    return handleApiError(error);
  }
}

// ----------------------------------------
// POST /api/applications — Apply to campaign
// ----------------------------------------
const applySchema = applicationCreateSchema.extend({
  coverLetter: z.string().min(20).max(1000).optional(),
  attachmentKeys: z.array(z.string()).max(5).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const { creator } = await requireCreator();
    const body = await parseBody(req, applySchema);

    // Verify campaign exists and is active
    const campaign = await prisma.campaign.findUnique({
      where: { id: body.campaignId },
      select: {
        id: true,
        status: true,
        applicationDeadline: true,
        maxCreators: true,
        _count: { select: { deals: true } },
      },
    });

    if (!campaign) throw new ApiNotFoundError("Campaign");

    if (campaign.status !== "ACTIVE") {
      return apiError("This campaign is not accepting applications", 409);
    }

    // Check deadline
    if (campaign.applicationDeadline && campaign.applicationDeadline < new Date()) {
      return apiError("Application deadline has passed", 409);
    }

    // Check max creators reached
    if (campaign.maxCreators && campaign._count.deals >= campaign.maxCreators) {
      return apiError("This campaign has reached its maximum number of creators", 409);
    }

    // Check duplicate application
    const existing = await prisma.application.findUnique({
      where: {
        campaignId_creatorId: {
          campaignId: body.campaignId,
          creatorId: creator.id,
        },
      },
    });

    if (existing) {
      return apiError("You have already applied to this campaign", 409);
    }

    const application = await prisma.application.create({
      data: {
        campaignId: body.campaignId,
        creatorId: creator.id,
        coverLetter: body.coverLetter || body.proposal,
        proposedRate: body.price,
        proposedTerms: body.proposal,
        attachmentKeys: body.attachmentKeys,
        status: "PENDING",
      },
      include: {
        campaign: {
          select: { id: true, title: true, slug: true },
        },
        creator: {
          select: { id: true, displayName: true, slug: true },
        },
      },
    });

    // Create notification for the brand
    const campaignFull = await prisma.campaign.findUnique({
      where: { id: body.campaignId },
      select: { brand: { select: { userId: true } } },
    });

    if (campaignFull?.brand) {
      await prisma.notification.create({
        data: {
          userId: campaignFull.brand.userId,
          type: "NEW_APPLICATION",
          title: "Nueva aplicacion",
          body: `${creator.displayName} aplico a tu campana "${application.campaign.title}"`,
          data: {
            applicationId: application.id,
            campaignId: body.campaignId,
            creatorSlug: creator.slug,
          },
        },
      });
    }

    return apiCreated(application);
  } catch (error) {
    return handleApiError(error);
  }
}
