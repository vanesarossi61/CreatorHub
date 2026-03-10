// CreatorHub — Frontend Types
// Types aligned with API response shapes (Prisma includes).
// These represent what the frontend RECEIVES, not the DB models directly.

import type {
  UserType,
  CreatorRole,
  Platform,
  DealStatus,
  CampaignStatus,
  ApplicationStatus,
  ApiResponse,
  PaginatedResponse,
} from "@creatorhub/shared";

// Re-export shared types for convenience
export type {
  UserType,
  CreatorRole,
  Platform,
  DealStatus,
  CampaignStatus,
  ApplicationStatus,
  ApiResponse,
  PaginatedResponse,
};

// =============================
// USER & AUTH
// =============================

export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  type: UserType;
  onboardingDone: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator: CreatorSummary | null;
  brand: BrandSummary | null;
}

// =============================
// CREATOR
// =============================

export interface CreatorSummary {
  id: string;
  displayName: string;
  slug: string;
  avatarKey: string | null;
  isVerified: boolean;
  isAvailable: boolean;
  category: string;
  avgRating: number;
  totalReviews: number;
  completedDeals: number;
}

export interface CreatorDetail extends CreatorSummary {
  bio: string | null;
  country: string | null;
  city: string | null;
  languages: string[];
  website: string | null;
  bannerKey: string | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  totalEarnings: number;
  responseTime: number | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string; firstName: string | null; lastName: string | null };
  socialAccounts: SocialAccount[];
  portfolioItems: PortfolioItem[];
  skills: { skill: { id: string; name: string; slug: string } }[];
  _count: { applications: number; deals: number; reviews: number };
}

export interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  profileUrl: string;
  followers: number;
  isVerified: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  mediaKey: string;
  mediaType: string;
  thumbnailKey: string | null;
  externalUrl: string | null;
  sortOrder: number;
}

// =============================
// BRAND
// =============================

export interface BrandSummary {
  id: string;
  companyName: string;
  slug: string;
  logoKey: string | null;
  isVerified: boolean;
  avgRating: number;
  totalReviews: number;
}

export interface BrandDetail extends BrandSummary {
  description: string | null;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  country: string | null;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string };
  _count: { campaigns: number; reviews: number };
}

// =============================
// CAMPAIGN
// =============================

export interface CampaignListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string | null;
  budget: number;
  budgetSpent: number;
  currency: string;
  dealType: string;
  status: CampaignStatus;
  visibility: string;
  maxCreators: number | null;
  startDate: string | null;
  endDate: string | null;
  applicationDeadline: string | null;
  tags: string[];
  createdAt: string;
  brand: BrandSummary;
  _count: { applications: number; deals: number };
}

export interface CampaignDetail extends CampaignListItem {
  brief: string | null;
  requirements: Record<string, unknown> | null;
  deliverables: Record<string, unknown> | null;
  updatedAt: string;
  applications: ApplicationListItem[];
  deals: DealListItem[];
}

// =============================
// APPLICATION
// =============================

export interface ApplicationListItem {
  id: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  proposedRate: number | null;
  proposedTerms: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  campaign: {
    id: string;
    title: string;
    slug: string;
    budget: number;
    dealType: string;
    brand: BrandSummary;
  };
  creator: CreatorSummary;
}

// =============================
// DEAL
// =============================

export interface DealListItem {
  id: string;
  status: string;
  agreedRate: number;
  currency: string;
  terms: string | null;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  campaign: {
    id: string;
    title: string;
    slug: string;
    dealType: string;
    brand: BrandSummary;
  };
  creator: CreatorSummary;
  _count: { deliverables: number; milestones: number };
}

export interface DealDetail extends DealListItem {
  cancellationReason: string | null;
  updatedAt: string;
  application: {
    id: string;
    coverLetter: string | null;
    proposedRate: number | null;
    proposedTerms: string | null;
  } | null;
  deliverables: DeliverableItem[];
  milestones: MilestoneItem[];
  payouts: PayoutItem[];
}

export interface DeliverableItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  dueDate: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  fileKeys: string[];
  feedback: string | null;
  sortOrder: number;
}

export interface MilestoneItem {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  sortOrder: number;
}

export interface PayoutItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  stripePaymentId: string | null;
  createdAt: string;
}

// =============================
// NOTIFICATION
// =============================

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

// =============================
// MESSAGE
// =============================

export interface ConversationSummary {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
    type: UserType;
  };
  lastMessage: {
    body: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  attachmentKeys: string[];
  isRead: boolean;
  createdAt: string;
}

// =============================
// DASHBOARD STATS
// =============================

export interface DashboardStats {
  role: UserType;
  stats: {
    label: string;
    value: number | string;
    change?: number; // percentage change
    icon?: string;
  }[];
  recentActivity: {
    id: string;
    type: string;
    title: string;
    description: string;
    createdAt: string;
    link?: string;
  }[];
}

// =============================
// REVIEW
// =============================

export interface ReviewItem {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    avatarUrl: string | null;
    type: UserType;
  };
  deal: {
    id: string;
    campaign: { title: string; slug: string };
  };
}

// =============================
// QUERY PARAMS
// =============================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface CampaignFilters extends PaginationParams {
  status?: CampaignStatus;
  category?: string;
  dealType?: string;
  q?: string;
  sortBy?: "createdAt" | "budget" | "applicationDeadline" | "title";
  sortOrder?: "asc" | "desc";
  minBudget?: number;
  maxBudget?: number;
}

export interface CreatorFilters extends PaginationParams {
  category?: string;
  country?: string;
  isAvailable?: boolean;
  q?: string;
  sortBy?: "avgRating" | "completedDeals" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface ApplicationFilters extends PaginationParams {
  status?: ApplicationStatus;
  campaignId?: string;
}

export interface DealFilters extends PaginationParams {
  status?: string;
  campaignId?: string;
}

export interface NotificationFilters extends PaginationParams {
  isRead?: boolean;
}
