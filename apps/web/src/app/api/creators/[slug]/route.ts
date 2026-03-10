// CreatorHub — Creator Profile API
// GET /api/creators/[slug] — Public creator profile with full details

import { NextRequest } from "next/server";
import { prisma } from "@creatorhub/database";
import {
  apiSuccess,
  handleApiError,
  ApiNotFoundError,
} from "@/lib/api-helpers";

interface RouteParams {
  params: { slug: string };
}

// ----------------------------------------
// GET /api/creators/[slug] — Full public profile
// ----------------------------------------
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const creator = await prisma.creator.findUnique({
      where: { slug: params.slug },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        socialAccounts: {
          select: {
            platform: true,
            username: true,
            profileUrl: true,
            followers: true,
            isVerified: true,
          },
          orderBy: { followers: "desc" },
        },
        portfolioItems: {
          select: {
            id: true,
            title: true,
            description: true,
            mediaKey: true,
            mediaType: true,
            thumbnailKey: true,
            externalUrl: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: "asc" },
          take: 20,
        },
        skills: {
          select: {
            skill: { select: { id: true, name: true, slug: true, category: true } },
          },
        },
        reviews: {
          where: { isPublic: true },
          select: {
            id: true,
            rating: true,
            title: true,
            comment: true,
            createdAt: true,
            brand: {
              select: { companyName: true, slug: true, logoKey: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            deals: true,
            applications: true,
            reviews: true,
            portfolioItems: true,
          },
        },
      },
    });

    if (!creator) throw new ApiNotFoundError("Creator");

    // Check if user is active
    if (!creator.user) throw new ApiNotFoundError("Creator");

    // Compute aggregated stats
    const totalFollowers = creator.socialAccounts.reduce(
      (sum, acc) => sum + acc.followers,
      0
    );

    const platforms = creator.socialAccounts.map((acc) => acc.platform);

    // Shape the response
    const profile = {
      id: creator.id,
      displayName: creator.displayName,
      slug: creator.slug,
      bio: creator.bio,
      category: creator.category,
      country: creator.country,
      city: creator.city,
      languages: creator.languages,
      website: creator.website,
      avatarKey: creator.avatarKey,
      bannerKey: creator.bannerKey,
      isVerified: creator.isVerified,
      isAvailable: creator.isAvailable,
      hourlyRateMin: creator.hourlyRateMin,
      hourlyRateMax: creator.hourlyRateMax,
      avgRating: creator.avgRating,
      totalReviews: creator.totalReviews,
      completedDeals: creator.completedDeals,
      responseTime: creator.responseTime,
      memberSince: creator.user.createdAt,

      // Aggregated
      totalFollowers,
      platforms,

      // Relations
      socialAccounts: creator.socialAccounts,
      portfolio: creator.portfolioItems,
      skills: creator.skills.map((cs) => cs.skill),
      recentReviews: creator.reviews,
      counts: creator._count,
    };

    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
