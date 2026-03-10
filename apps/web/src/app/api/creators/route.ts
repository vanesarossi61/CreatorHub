// CreatorHub — Creators API
// GET /api/creators — Public search & listing of creators

import { NextRequest } from "next/server";
import { prisma } from "@creatorhub/database";
import {
  getPagination,
  paginatedResponse,
  handleApiError,
} from "@/lib/api-helpers";

// ----------------------------------------
// GET /api/creators — Public directory
// ----------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { page, pageSize, skip } = getPagination(req);
    const url = new URL(req.url);

    // Filters
    const search = url.searchParams.get("q");
    const category = url.searchParams.get("category");
    const country = url.searchParams.get("country");
    const platform = url.searchParams.get("platform");
    const minRating = url.searchParams.get("minRating");
    const isVerified = url.searchParams.get("verified");
    const isAvailable = url.searchParams.get("available");
    const minRate = url.searchParams.get("minRate");
    const maxRate = url.searchParams.get("maxRate");
    const sortBy = url.searchParams.get("sortBy") || "avgRating";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const language = url.searchParams.get("language");
    const skill = url.searchParams.get("skill");

    const where: any = {
      isAvailable: true, // default: only show available
      user: { isActive: true },
    };

    // Text search across name and bio
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) where.category = category;
    if (country) where.country = country;
    if (language) where.languages = { has: language };
    if (isVerified === "true") where.isVerified = true;
    if (isAvailable === "false") delete where.isAvailable; // show all
    if (minRating) where.avgRating = { gte: parseFloat(minRating) };

    // Rate range filter
    if (minRate || maxRate) {
      if (minRate) {
        where.hourlyRateMin = { ...(where.hourlyRateMin || {}), gte: parseFloat(minRate) };
      }
      if (maxRate) {
        where.hourlyRateMax = { ...(where.hourlyRateMax || {}), lte: parseFloat(maxRate) };
      }
    }

    // Platform filter — creator has a social account on this platform
    if (platform) {
      where.socialAccounts = { some: { platform: platform } };
    }

    // Skill filter
    if (skill) {
      where.skills = {
        some: { skill: { slug: skill } },
      };
    }

    // Sort validation
    const allowedSorts = [
      "avgRating",
      "completedDeals",
      "totalEarnings",
      "createdAt",
      "displayName",
      "hourlyRateMin",
    ];
    const orderField = allowedSorts.includes(sortBy) ? sortBy : "avgRating";
    const orderDir = sortOrder === "asc" ? "asc" : "desc";

    const [creators, total] = await Promise.all([
      prisma.creator.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [orderField]: orderDir },
        select: {
          id: true,
          displayName: true,
          slug: true,
          bio: true,
          category: true,
          country: true,
          languages: true,
          avatarKey: true,
          isVerified: true,
          isAvailable: true,
          hourlyRateMin: true,
          hourlyRateMax: true,
          avgRating: true,
          totalReviews: true,
          completedDeals: true,
          responseTime: true,
          socialAccounts: {
            select: {
              platform: true,
              username: true,
              followers: true,
              isVerified: true,
            },
          },
          skills: {
            select: {
              skill: { select: { name: true, slug: true } },
            },
          },
        },
      }),
      prisma.creator.count({ where }),
    ]);

    return paginatedResponse(creators, total, { page, pageSize, skip });
  } catch (error) {
    return handleApiError(error);
  }
}
