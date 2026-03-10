// CreatorHub — SEO Metadata Helpers
// Centralized metadata generation for Next.js 14 App Router.
// Use generateMeta() in page-level generateMetadata() exports.

import type { Metadata } from "next";

// =============================
// CONSTANTS
// =============================

const SITE_NAME = "CreatorHub";
const SITE_DESCRIPTION =
  "The marketplace connecting brands with content creators. Find creators, launch campaigns, and manage deals — all in one platform.";
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorhub.com";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

// =============================
// BASE METADATA
// =============================

export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Creator x Brand Marketplace`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "creator marketplace",
    "influencer marketing",
    "brand deals",
    "content creators",
    "creator economy",
    "sponsorship platform",
    "UGC creators",
    "brand collaborations",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Creator x Brand Marketplace`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Creator x Brand Marketplace`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Creator x Brand Marketplace`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

// =============================
// PAGE-LEVEL METADATA GENERATOR
// =============================

interface GenerateMetaParams {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article" | "profile";
}

/**
 * Generate page-specific metadata with OG tags.
 * Usage in any page.tsx:
 *
 *   export function generateMetadata() {
 *     return generateMeta({ title: "Explore Creators", path: "/explore" });
 *   }
 */
export function generateMeta(params: GenerateMetaParams): Metadata {
  const {
    title,
    description = SITE_DESCRIPTION,
    path = "",
    image = OG_IMAGE,
    noIndex = false,
    type = "website",
  } = params;

  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type,
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  };
}

// =============================
// DYNAMIC METADATA GENERATORS
// =============================

/** Metadata for a campaign detail page */
export function campaignMeta(campaign: {
  title: string;
  description: string;
  slug: string;
  brand?: { companyName: string };
}): Metadata {
  return generateMeta({
    title: campaign.title,
    description: `${campaign.description.slice(0, 155)}...`,
    path: `/campaigns/${campaign.slug}`,
    type: "article",
  });
}

/** Metadata for a creator profile page */
export function creatorMeta(creator: {
  displayName: string;
  bio?: string | null;
  slug: string;
  category: string;
}): Metadata {
  return generateMeta({
    title: `${creator.displayName} — ${creator.category} Creator`,
    description:
      creator.bio?.slice(0, 155) ||
      `${creator.displayName} is a ${creator.category} creator on CreatorHub.`,
    path: `/creators/${creator.slug}`,
    type: "profile",
  });
}

// =============================
// STRUCTURED DATA (JSON-LD)
// =============================

export function organizationJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: SITE_DESCRIPTION,
    sameAs: [],
  });
}

export function campaignJsonLd(campaign: {
  title: string;
  description: string;
  slug: string;
  budget: number;
  currency: string;
  startDate?: string | null;
  endDate?: string | null;
  brand: { companyName: string };
}): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: campaign.title,
    description: campaign.description,
    url: `${SITE_URL}/campaigns/${campaign.slug}`,
    hiringOrganization: {
      "@type": "Organization",
      name: campaign.brand.companyName,
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: campaign.currency,
      value: campaign.budget,
    },
    datePosted: campaign.startDate || undefined,
    validThrough: campaign.endDate || undefined,
  });
}

export function creatorJsonLd(creator: {
  displayName: string;
  bio?: string | null;
  slug: string;
  avgRating: number;
  totalReviews: number;
}): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: creator.displayName,
    description: creator.bio || "",
    url: `${SITE_URL}/creators/${creator.slug}`,
    aggregateRating:
      creator.totalReviews > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: creator.avgRating,
            reviewCount: creator.totalReviews,
          }
        : undefined,
  });
}
