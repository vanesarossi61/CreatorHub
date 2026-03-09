// @creatorhub/shared — Shared types, constants, and validation schemas
// This package is imported by both apps/web and packages/api

import { z } from "zod";

// =============================
// ENUMS & CONSTANTS
// =============================

export const USER_TYPES = ["CREATOR", "BRAND", "AGENCY"] as const;
export type UserType = (typeof USER_TYPES)[number];

export const CREATOR_ROLES = [
  "CLIPPER",
  "UGC",
  "INFLUENCER",
  "REPLICATOR",
] as const;
export type CreatorRole = (typeof CREATOR_ROLES)[number];

export const PLATFORMS = [
  "TIKTOK",
  "INSTAGRAM",
  "YOUTUBE",
  "TWITCH",
  "TWITTER",
  "KICK",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const DEAL_STATUS = [
  "PENDING",
  "ACCEPTED",
  "IN_PROGRESS",
  "DELIVERED",
  "REVISION",
  "APPROVED",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
] as const;
export type DealStatus = (typeof DEAL_STATUS)[number];

export const CAMPAIGN_STATUS = [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "CLOSED",
  "COMPLETED",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUS)[number];

export const APPLICATION_STATUS = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUS)[number];

export const TRANSACTION_STATUS = [
  "PENDING",
  "HELD",
  "RELEASED",
  "REFUNDED",
  "FAILED",
] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUS)[number];

export const LANGUAGES = [
  "es",
  "en",
  "pt",
  "fr",
  "de",
  "it",
  "ja",
  "ko",
  "zh",
] as const;

export const COUNTRIES = [
  "AR",
  "MX",
  "CO",
  "CL",
  "PE",
  "BR",
  "US",
  "ES",
  "UY",
] as const;

// =============================
// ROLE DISPLAY CONFIG
// =============================

export const ROLE_CONFIG: Record<
  CreatorRole,
  { label: string; description: string; color: string }
> = {
  CLIPPER: {
    label: "Clipper",
    description: "Recorta y edita los mejores momentos de streams y videos",
    color: "bg-blue-100 text-blue-800",
  },
  UGC: {
    label: "UGC Creator",
    description: "Crea contenido autentico estilo usuario para marcas",
    color: "bg-green-100 text-green-800",
  },
  INFLUENCER: {
    label: "Influencer",
    description: "Promociona productos con tu audiencia y engagement",
    color: "bg-purple-100 text-purple-800",
  },
  REPLICATOR: {
    label: "Replicator",
    description:
      "Adapta contenido exitoso a diferentes plataformas y formatos",
    color: "bg-orange-100 text-orange-800",
  },
};

// =============================
// VALIDATION SCHEMAS (Zod)
// =============================

export const onboardingCreatorSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().max(500).optional(),
  country: z.enum(COUNTRIES),
  languages: z.array(z.enum(LANGUAGES)).min(1),
  roles: z.array(z.enum(CREATOR_ROLES)).min(1),
});

export const onboardingBrandSchema = z.object({
  companyName: z.string().min(2).max(100),
  industry: z.string().min(2).max(50),
  country: z.enum(COUNTRIES),
  website: z.string().url().optional(),
});

export const campaignCreateSchema = z.object({
  title: z.string().min(5).max(100),
  brief: z.string().min(20).max(2000),
  budgetMin: z.number().positive(),
  budgetMax: z.number().positive(),
  rolesNeeded: z.array(z.enum(CREATOR_ROLES)).min(1),
  platforms: z.array(z.enum(PLATFORMS)).min(1),
  deadline: z.string().datetime(),
});

export const applicationCreateSchema = z.object({
  campaignId: z.string().uuid(),
  proposal: z.string().min(20).max(1000),
  price: z.number().positive(),
});

export const reviewCreateSchema = z.object({
  dealId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  text: z.string().min(10).max(500),
});

// =============================
// TYPE EXPORTS (from schemas)
// =============================

export type OnboardingCreatorInput = z.infer<typeof onboardingCreatorSchema>;
export type OnboardingBrandInput = z.infer<typeof onboardingBrandSchema>;
export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

// =============================
// UTILITY TYPES
// =============================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
