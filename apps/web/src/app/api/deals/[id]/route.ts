// CreatorHub — Deal Detail API
// GET   /api/deals/[id] — Get deal details
// PATCH /api/deals/[id] — Update deal (status, terms, rate)

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@creatorhub/database";
import {
  apiSuccess,
  apiError,
  requireAuthUser,
  handleApiError,
  ApiNotFoundError,
  ApiForbiddenError,
} from "@/lib/api-helpers";

interface RouteParams {
  params: { id: string };
}

async function findDeal(id: string) {
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      campaign: {
        select: {
          id: true,
          title: true,
          slug: true,
          dealType: true,
          budget: true,
          brandId: true,
          brand: {
            select: {
              id: true,
              companyName: true,
              slug: true,
              logoKey: true,
              userId: true,
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
          userId: true,
        },
      },
      application: {
        select: {
          id: true,
          coverLetter: true,
          proposedRate: true,
          proposedTerms: true,
        },
      },
      deliverables: {
        orderBy: { sortOrder: "asc" },
      },
      milestones: {
        orderBy: { sortOrder: "asc" },
      },
      payouts: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
  if (!deal) throw new ApiNotFoundError("Deal");
  return deal;
}

// ----------------------------------------
// GET /api/deals/[id]
// ----------------------------------------
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuthUser();
    const deal = await findDeal(params.id);

    // Only the deal's creator or the campaign's brand can view
    const isCreator = user.creator?.id === deal.creatorId;
    const isBrand = user.brand?.id === deal.campaign.brandId;
    if (!isCreator && !isBrand) {
      throw new ApiForbiddenError("You don't have access to this deal");
    }

    return apiSuccess(deal);
  } catch (error) {
    return handleApiError(error);
  }
}

// ----------------------------------------
// PATCH /api/deals/[id] — Update deal
// Both parties can update within their permissions.
// ----------------------------------------
const updateDealSchema = z.object({
  status: z
    .enum([
      "NEGOTIATION",
      "ACTIVE",
      "IN_PROGRESS",
      "IN_REVIEW",
      "COMPLETED",
      "CANCELLED",
      "DISPUTED",
    ])
    .optional(),
  agreedRate: z.number().positive().optional(),
  terms: z.string().max(5000).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  cancellationReason: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuthUser();
    const deal = await findDeal(params.id);
    const body = updateDealSchema.parse(await req.json());

    const isCreator = user.creator?.id === deal.creatorId;
    const isBrand = user.brand?.id === deal.campaign.brandId;
    if (!isCreator && !isBrand) {
      throw new ApiForbiddenError("You don't have access to this deal");
    }

    // Validate status transitions
    if (body.status) {
      const transitions: Record<string, { brand: string[]; creator: string[] }> = {
        NEGOTIATION: {
          brand: ["ACTIVE", "CANCELLED"],
          creator: ["CANCELLED"],
        },
        ACTIVE: {
          brand: ["IN_PROGRESS", "CANCELLED"],
          creator: ["IN_PROGRESS", "CANCELLED"],
        },
        IN_PROGRESS: {
          brand: ["IN_REVIEW", "CANCELLED", "DISPUTED"],
          creator: ["IN_REVIEW", "CANCELLED", "DISPUTED"],
        },
        IN_REVIEW: {
          brand: ["COMPLETED", "IN_PROGRESS", "DISPUTED"],
          creator: ["DISPUTED"],
        },
      };

      const role = isBrand ? "brand" : "creator";
      const allowed = transitions[deal.status]?.[role] || [];

      if (!allowed.includes(body.status)) {
        return apiError(
          `As ${role}, you cannot transition deal from ${deal.status} to ${body.status}`,
          409
        );
      }
    }

    // Can't modify completed/cancelled deals (except status was already validated)
    if (["COMPLETED", "CANCELLED"].includes(deal.status) && !body.status) {
      return apiError("Cannot modify a completed or cancelled deal", 409);
    }

    // Build update
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.agreedRate !== undefined) updateData.agreedRate = body.agreedRate;
    if (body.terms !== undefined) updateData.terms = body.terms;
    if (body.startDate !== undefined) {
      updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    }
    if (body.endDate !== undefined) {
      updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    }

    // Handle completion
    if (body.status === "COMPLETED") {
      updateData.completedAt = new Date();

      // Update creator stats
      await prisma.creator.update({
        where: { id: deal.creatorId },
        data: {
          completedDeals: { increment: 1 },
          totalEarnings: { increment: deal.agreedRate },
        },
      });

      // Update brand totalSpent
      await prisma.brand.update({
        where: { id: deal.campaign.brandId },
        data: {
          totalSpent: { increment: deal.agreedRate },
        },
      });

      // Update campaign budgetSpent
      await prisma.campaign.update({
        where: { id: deal.campaignId },
        data: {
          budgetSpent: { increment: deal.agreedRate },
        },
      });
    }

    // Handle cancellation
    if (body.status === "CANCELLED") {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = body.cancellationReason;
    }

    const updated = await prisma.deal.update({
      where: { id: params.id },
      data: updateData,
      include: {
        campaign: {
          select: { id: true, title: true, slug: true },
        },
        creator: {
          select: { id: true, displayName: true, slug: true },
        },
        _count: {
          select: { deliverables: true, milestones: true },
        },
      },
    });

    // Notify the other party
    if (body.status) {
      const notifyUserId = isBrand
        ? deal.creator.userId
        : deal.campaign.brand.userId;

      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          type: "DEAL_UPDATED",
          title: "Deal actualizado",
          body: `El deal para "${deal.campaign.title}" cambio a estado: ${body.status}`,
          data: { dealId: deal.id, campaignSlug: deal.campaign.slug },
        },
      });
    }

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
