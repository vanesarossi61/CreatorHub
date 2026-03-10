// CreatorHub — Campaign Detail API
// GET    /api/campaigns/[slug] — Get campaign details (public)
// PUT    /api/campaigns/[slug] — Update campaign (owner brand only)
// DELETE /api/campaigns/[slug] — Delete/cancel campaign (owner brand only)

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@creatorhub/database";
import {
  apiSuccess,
  apiError,
  requireBrand,
  getAuthenticatedUser,
  handleApiError,
  ApiNotFoundError,
  ApiForbiddenError,
} from "@/lib/api-helpers";

interface RouteParams {
  params: { slug: string };
}

// Helper: find campaign or throw
async function findCampaign(slug: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    include: {
      brand: {
        select: {
          id: true,
          companyName: true,
          slug: true,
          logoKey: true,
          isVerified: true,
          avgRating: true,
          totalReviews: true,
        },
      },
      _count: {
        select: { applications: true, deals: true },
      },
    },
  });
  if (!campaign) throw new ApiNotFoundError("Campaign");
  return campaign;
}

// ----------------------------------------
// GET /api/campaigns/[slug]
// ----------------------------------------
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const campaign = await findCampaign(params.slug);

    // If private, only the owner brand can see it
    if (campaign.visibility === "PRIVATE") {
      const user = await getAuthenticatedUser();
      if (!user?.brand || user.brand.id !== campaign.brandId) {
        throw new ApiNotFoundError("Campaign");
      }
    }

    return apiSuccess(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

// ----------------------------------------
// PUT /api/campaigns/[slug] — Update
// ----------------------------------------
const updateCampaignSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(20).max(5000).optional(),
  brief: z.string().min(20).max(2000).optional(),
  budget: z.number().positive().optional(),
  dealType: z.enum(["FIXED_PRICE", "HOURLY", "REVENUE_SHARE", "PRODUCT_ONLY", "HYBRID"]).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).optional(),
  maxCreators: z.number().int().positive().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  applicationDeadline: z.string().datetime().nullable().optional(),
  requirements: z.record(z.unknown()).optional(),
  deliverables: z.record(z.unknown()).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  currency: z.string().length(3).optional(),
});

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { brand } = await requireBrand();
    const campaign = await findCampaign(params.slug);

    // Only owner can update
    if (campaign.brandId !== brand.id) {
      throw new ApiForbiddenError("You can only edit your own campaigns");
    }

    // Can't edit completed/cancelled campaigns
    if (["COMPLETED", "CANCELLED"].includes(campaign.status)) {
      return apiError("Cannot edit a completed or cancelled campaign", 409);
    }

    const body = updateCampaignSchema.parse(await req.json());

    // Build update data, converting date strings to Date objects
    const updateData: any = { ...body };
    if (body.startDate !== undefined) {
      updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    }
    if (body.endDate !== undefined) {
      updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    }
    if (body.applicationDeadline !== undefined) {
      updateData.applicationDeadline = body.applicationDeadline
        ? new Date(body.applicationDeadline)
        : null;
    }

    const updated = await prisma.campaign.update({
      where: { slug: params.slug },
      data: updateData,
      include: {
        brand: {
          select: { id: true, companyName: true, slug: true },
        },
        _count: {
          select: { applications: true, deals: true },
        },
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// ----------------------------------------
// DELETE /api/campaigns/[slug]
// ----------------------------------------
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { brand } = await requireBrand();
    const campaign = await findCampaign(params.slug);

    if (campaign.brandId !== brand.id) {
      throw new ApiForbiddenError("You can only delete your own campaigns");
    }

    // If campaign has active deals, can't delete — only cancel
    const activeDeals = await prisma.deal.count({
      where: {
        campaignId: campaign.id,
        status: { in: ["ACTIVE", "IN_PROGRESS", "IN_REVIEW"] },
      },
    });

    if (activeDeals > 0) {
      // Soft cancel instead of hard delete
      const cancelled = await prisma.campaign.update({
        where: { slug: params.slug },
        data: { status: "CANCELLED" },
      });
      return apiSuccess({ ...cancelled, _note: "Campaign cancelled (has active deals)" });
    }

    // Hard delete if no active deals
    await prisma.campaign.delete({ where: { slug: params.slug } });
    return apiSuccess({ deleted: true, slug: params.slug });
  } catch (error) {
    return handleApiError(error);
  }
}
