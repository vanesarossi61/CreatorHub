// CreatorHub — Campaigns API
// GET  /api/campaigns        — List campaigns (public, with filters)
// POST /api/campaigns        — Create campaign (brands only)

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@creatorhub/database";
import { campaignCreateSchema } from "@creatorhub/shared";
import {
  apiSuccess,
  apiCreated,
  requireBrand,
  getPagination,
  paginatedResponse,
  parseBody,
  handleApiError,
  uniqueSlug,
} from "@/lib/api-helpers";

// ----------------------------------------
// GET /api/campaigns — Public listing
// ----------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { page, pageSize, skip } = getPagination(req);
    const url = new URL(req.url);

    // Filters
    const status = url.searchParams.get("status") || "ACTIVE";
    const category = url.searchParams.get("category");
    const dealType = url.searchParams.get("dealType");
    const search = url.searchParams.get("q");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const minBudget = url.searchParams.get("minBudget");
    const maxBudget = url.searchParams.get("maxBudget");

    const where: any = {
      status: status as any,
      visibility: "PUBLIC",
    };

    if (category) where.category = category;
    if (dealType) where.dealType = dealType;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search.toLowerCase()] } },
      ];
    }
    if (minBudget || maxBudget) {
      where.budget = {};
      if (minBudget) where.budget.gte = parseFloat(minBudget);
      if (maxBudget) where.budget.lte = parseFloat(maxBudget);
    }

    // Validate sortBy
    const allowedSorts = ["createdAt", "budget", "applicationDeadline", "title"];
    const orderField = allowedSorts.includes(sortBy) ? sortBy : "createdAt";
    const orderDir = sortOrder === "asc" ? "asc" : "desc";

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [orderField]: orderDir },
        include: {
          brand: {
            select: {
              id: true,
              companyName: true,
              slug: true,
              logoKey: true,
              isVerified: true,
              avgRating: true,
            },
          },
          _count: {
            select: { applications: true, deals: true },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return paginatedResponse(campaigns, total, { page, pageSize, skip });
  } catch (error) {
    return handleApiError(error);
  }
}

// ----------------------------------------
// POST /api/campaigns — Create (brands only)
// ----------------------------------------

// Extended schema for API (adds optional fields not in shared schema)
const createCampaignApiSchema = campaignCreateSchema.extend({
  description: z.string().min(20).max(5000).optional(),
  dealType: z.enum(["FIXED_PRICE", "HOURLY", "REVENUE_SHARE", "PRODUCT_ONLY", "HYBRID"]).default("FIXED_PRICE"),
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).default("PUBLIC"),
  maxCreators: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  requirements: z.record(z.unknown()).optional(),
  deliverables: z.record(z.unknown()).optional(),
  tags: z.array(z.string().max(30)).max(10).default([]),
  currency: z.string().length(3).default("USD"),
});

export async function POST(req: NextRequest) {
  try {
    const { brand } = await requireBrand();
    const body = await parseBody(req, createCampaignApiSchema);

    const slug = await uniqueSlug(body.title, "campaign");

    const campaign = await prisma.campaign.create({
      data: {
        brandId: brand.id,
        title: body.title,
        slug,
        description: body.description || body.brief,
        brief: body.brief,
        category: body.rolesNeeded?.[0] as any, // primary category from first role
        budget: body.budgetMax,
        dealType: body.dealType as any,
        status: "DRAFT",
        visibility: body.visibility as any,
        maxCreators: body.maxCreators,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        applicationDeadline: body.deadline ? new Date(body.deadline) : undefined,
        requirements: body.requirements || {
          minFollowers: 0,
          platforms: body.platforms,
          rolesNeeded: body.rolesNeeded,
          budgetRange: { min: body.budgetMin, max: body.budgetMax },
        },
        deliverables: body.deliverables,
        tags: body.tags,
        currency: body.currency,
      },
      include: {
        brand: {
          select: { id: true, companyName: true, slug: true },
        },
      },
    });

    return apiCreated(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}
