// CreatorHub — Application Detail API
// GET    /api/applications/[id] — Get application details
// PATCH  /api/applications/[id] — Update status (accept/reject/shortlist)
// DELETE /api/applications/[id] — Withdraw application (creator only)

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

async function findApplication(id: string) {
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      campaign: {
        select: {
          id: true,
          title: true,
          slug: true,
          brandId: true,
          budget: true,
          dealType: true,
          status: true,
          brand: {
            select: { id: true, companyName: true, slug: true, userId: true },
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
          userId: true,
          socialAccounts: {
            select: { platform: true, username: true, followers: true },
          },
        },
      },
      deal: { select: { id: true, status: true } },
    },
  });
  if (!app) throw new ApiNotFoundError("Application");
  return app;
}

// ----------------------------------------
// GET /api/applications/[id]
// ----------------------------------------
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuthUser();
    const application = await findApplication(params.id);

    // Only the creator who applied or the campaign's brand can see it
    const isCreator = user.creator?.id === application.creatorId;
    const isBrand = user.brand?.id === application.campaign.brandId;
    if (!isCreator && !isBrand) {
      throw new ApiForbiddenError("You don't have access to this application");
    }

    return apiSuccess(application);
  } catch (error) {
    return handleApiError(error);
  }
}

// ----------------------------------------
// PATCH /api/applications/[id] — Status updates
// Brand: PENDING -> SHORTLISTED -> ACCEPTED or REJECTED
// Creator: PENDING/SHORTLISTED -> WITHDRAWN
// ----------------------------------------
const updateStatusSchema = z.object({
  status: z.enum(["SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN"]),
  rejectionReason: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuthUser();
    const application = await findApplication(params.id);
    const body = updateStatusSchema.parse(await req.json());

    const isCreator = user.creator?.id === application.creatorId;
    const isBrand = user.brand?.id === application.campaign.brandId;

    // Validate permissions based on action
    if (body.status === "WITHDRAWN") {
      if (!isCreator) throw new ApiForbiddenError("Only the applicant can withdraw");
      if (!["PENDING", "SHORTLISTED"].includes(application.status)) {
        return apiError("Can only withdraw pending or shortlisted applications", 409);
      }
    } else {
      // SHORTLISTED, ACCEPTED, REJECTED — brand only
      if (!isBrand) throw new ApiForbiddenError("Only the campaign owner can update status");
    }

    // Validate state transitions
    const validTransitions: Record<string, string[]> = {
      PENDING: ["SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN"],
      SHORTLISTED: ["ACCEPTED", "REJECTED", "WITHDRAWN"],
    };

    const allowed = validTransitions[application.status];
    if (!allowed || !allowed.includes(body.status)) {
      return apiError(
        `Cannot transition from ${application.status} to ${body.status}`,
        409
      );
    }

    // Update application
    const updated = await prisma.application.update({
      where: { id: params.id },
      data: {
        status: body.status as any,
        rejectionReason: body.status === "REJECTED" ? body.rejectionReason : undefined,
      },
    });

    // Side effects based on new status
    if (body.status === "ACCEPTED") {
      // Auto-create a Deal when application is accepted
      await prisma.deal.create({
        data: {
          campaignId: application.campaignId,
          creatorId: application.creatorId,
          applicationId: application.id,
          status: "NEGOTIATION",
          agreedRate: application.proposedRate || 0,
          currency: "USD",
          terms: application.proposedTerms,
        },
      });

      // Notify creator
      await prisma.notification.create({
        data: {
          userId: application.creator.userId,
          type: "APPLICATION_ACCEPTED",
          title: "Aplicacion aceptada!",
          body: `Tu aplicacion a "${application.campaign.title}" fue aceptada. Revisa los detalles del deal.`,
          data: {
            applicationId: application.id,
            campaignSlug: application.campaign.slug,
          },
        },
      });
    }

    if (body.status === "REJECTED") {
      await prisma.notification.create({
        data: {
          userId: application.creator.userId,
          type: "APPLICATION_REJECTED",
          title: "Aplicacion no seleccionada",
          body: `Tu aplicacion a "${application.campaign.title}" no fue seleccionada.${body.rejectionReason ? ` Motivo: ${body.rejectionReason}` : ""}`,
          data: {
            applicationId: application.id,
            campaignSlug: application.campaign.slug,
          },
        },
      });
    }

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// ----------------------------------------
// DELETE /api/applications/[id] — Withdraw
// ----------------------------------------
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuthUser();
    const application = await findApplication(params.id);

    const isCreator = user.creator?.id === application.creatorId;
    if (!isCreator) {
      throw new ApiForbiddenError("Only the applicant can withdraw their application");
    }

    if (!["PENDING", "SHORTLISTED"].includes(application.status)) {
      return apiError("Can only withdraw pending or shortlisted applications", 409);
    }

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: { status: "WITHDRAWN" },
    });

    return apiSuccess({ ...updated, _note: "Application withdrawn" });
  } catch (error) {
    return handleApiError(error);
  }
}
