// CreatorHub — API Client Layer
// Typed fetch wrapper for all frontend-to-API communication.
// Centralizes error handling, auth (cookies auto-sent), and response parsing.

import type {
  ApiResponse,
  PaginatedResponse,
  CampaignListItem,
  CampaignDetail,
  CampaignFilters,
  CreatorDetail,
  CreatorFilters,
  CreatorSummary,
  ApplicationListItem,
  ApplicationFilters,
  DealListItem,
  DealDetail,
  DealFilters,
  DashboardStats,
  NotificationItem,
  NotificationFilters,
  ConversationSummary,
  MessageItem,
  ReviewItem,
  UserProfile,
  BrandDetail,
} from "./types";

import type {
  CampaignCreateInput,
  ApplicationCreateInput,
  ReviewCreateInput,
} from "@creatorhub/shared";

// =============================
// BASE CLIENT
// =============================

const BASE_URL = "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: string,
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

export class ValidationError extends Error {
  constructor(
    public fields: Record<string, string[]>,
    message = "Validation failed",
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  // Handle non-JSON responses (e.g., 500 HTML pages)
  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    if (!res.ok) {
      throw new ApiError(res.status, res.statusText, await res.text());
    }
    return {} as T;
  }

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    // Check for validation errors (422)
    if (res.status === 422 && json.error) {
      throw new ValidationError({}, json.error);
    }
    throw new ApiError(res.status, json.error || res.statusText, JSON.stringify(json));
  }

  return json.data as T;
}

function buildQuery(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

// =============================
// CAMPAIGNS
// =============================

export const campaigns = {
  list(filters: CampaignFilters = {}): Promise<PaginatedResponse<CampaignListItem>> {
    return request(`/campaigns${buildQuery(filters)}`);
  },

  get(slug: string): Promise<CampaignDetail> {
    return request(`/campaigns/${slug}`);
  },

  create(data: CampaignCreateInput & Record<string, unknown>): Promise<CampaignListItem> {
    return request("/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(slug: string, data: Partial<CampaignCreateInput> & Record<string, unknown>): Promise<CampaignListItem> {
    return request(`/campaigns/${slug}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  updateStatus(slug: string, status: string): Promise<CampaignListItem> {
    return request(`/campaigns/${slug}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

// =============================
// APPLICATIONS
// =============================

export const applications = {
  list(filters: ApplicationFilters = {}): Promise<PaginatedResponse<ApplicationListItem>> {
    return request(`/applications${buildQuery(filters)}`);
  },

  get(id: string): Promise<ApplicationListItem> {
    return request(`/applications/${id}`);
  },

  create(data: ApplicationCreateInput): Promise<ApplicationListItem> {
    return request("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateStatus(id: string, status: string, reason?: string): Promise<ApplicationListItem> {
    return request(`/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, rejectionReason: reason }),
    });
  },

  withdraw(id: string): Promise<ApplicationListItem> {
    return request(`/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "WITHDRAWN" }),
    });
  },
};

// =============================
// DEALS
// =============================

export const deals = {
  list(filters: DealFilters = {}): Promise<PaginatedResponse<DealListItem>> {
    return request(`/deals${buildQuery(filters)}`);
  },

  get(id: string): Promise<DealDetail> {
    return request(`/deals/${id}`);
  },

  updateStatus(id: string, status: string, reason?: string): Promise<DealListItem> {
    return request(`/deals/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, cancellationReason: reason }),
    });
  },

  update(id: string, data: Record<string, unknown>): Promise<DealListItem> {
    return request(`/deals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

// =============================
// CREATORS
// =============================

export const creators = {
  list(filters: CreatorFilters = {}): Promise<PaginatedResponse<CreatorSummary>> {
    return request(`/creators${buildQuery(filters)}`);
  },

  get(slug: string): Promise<CreatorDetail> {
    return request(`/creators/${slug}`);
  },
};

// =============================
// BRANDS
// =============================

export const brands = {
  get(slug: string): Promise<BrandDetail> {
    return request(`/brands/${slug}`);
  },
};

// =============================
// DASHBOARD
// =============================

export const dashboard = {
  getStats(): Promise<DashboardStats> {
    return request("/dashboard");
  },
};

// =============================
// PROFILE
// =============================

export interface UpdateCreatorProfileInput {
  displayName?: string;
  bio?: string;
  country?: string;
  city?: string;
  languages?: string[];
  website?: string;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  isAvailable?: boolean;
  category?: string;
}

export interface UpdateBrandProfileInput {
  companyName?: string;
  description?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  country?: string;
}

export const profile = {
  get(): Promise<UserProfile> {
    return request("/profile");
  },

  updateCreator(data: UpdateCreatorProfileInput): Promise<UserProfile> {
    return request("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  updateBrand(data: UpdateBrandProfileInput): Promise<UserProfile> {
    return request("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Social accounts
  addSocial(data: { platform: string; username: string; profileUrl: string }): Promise<void> {
    return request("/profile/socials", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  removeSocial(id: string): Promise<void> {
    return request(`/profile/socials/${id}`, { method: "DELETE" });
  },

  // Portfolio
  addPortfolioItem(data: {
    title: string;
    description?: string;
    mediaKey: string;
    mediaType: string;
    externalUrl?: string;
  }): Promise<void> {
    return request("/profile/portfolio", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  removePortfolioItem(id: string): Promise<void> {
    return request(`/profile/portfolio/${id}`, { method: "DELETE" });
  },

  reorderPortfolio(items: { id: string; sortOrder: number }[]): Promise<void> {
    return request("/profile/portfolio/reorder", {
      method: "PATCH",
      body: JSON.stringify({ items }),
    });
  },
};

// =============================
// NOTIFICATIONS
// =============================

export const notifications = {
  list(filters: NotificationFilters = {}): Promise<PaginatedResponse<NotificationItem>> {
    return request(`/notifications${buildQuery(filters)}`);
  },

  markRead(id: string): Promise<void> {
    return request(`/notifications/${id}/read`, { method: "PATCH" });
  },

  markAllRead(): Promise<void> {
    return request("/notifications/read-all", { method: "PATCH" });
  },

  getUnreadCount(): Promise<{ count: number }> {
    return request("/notifications/unread-count");
  },
};

// =============================
// MESSAGES
// =============================

export const messages = {
  listConversations(): Promise<ConversationSummary[]> {
    return request("/messages");
  },

  getConversation(userId: string, page = 1): Promise<PaginatedResponse<MessageItem>> {
    return request(`/messages/${userId}${buildQuery({ page })}`);
  },

  send(recipientId: string, body: string, attachmentKeys?: string[]): Promise<MessageItem> {
    return request("/messages", {
      method: "POST",
      body: JSON.stringify({ recipientId, body, attachmentKeys }),
    });
  },

  markRead(conversationUserId: string): Promise<void> {
    return request(`/messages/${conversationUserId}/read`, { method: "PATCH" });
  },
};

// =============================
// REVIEWS
// =============================

export const reviews = {
  listForCreator(creatorSlug: string, page = 1): Promise<PaginatedResponse<ReviewItem>> {
    return request(`/creators/${creatorSlug}/reviews${buildQuery({ page })}`);
  },

  create(data: ReviewCreateInput): Promise<ReviewItem> {
    return request("/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// =============================
// UPLOAD
// =============================

export interface PresignedUpload {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
}

export const upload = {
  async getPresignedUrl(filename: string, contentType: string): Promise<PresignedUpload> {
    return request("/upload", {
      method: "POST",
      body: JSON.stringify({ filename, contentType }),
    });
  },

  async uploadFile(file: File): Promise<PresignedUpload> {
    // Step 1: Get presigned URL
    const presigned = await this.getPresignedUrl(file.name, file.type);

    // Step 2: Upload directly to MinIO/S3
    const uploadRes = await fetch(presigned.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new ApiError(uploadRes.status, "Upload failed", await uploadRes.text());
    }

    return presigned;
  },
};

// =============================
// PAYMENTS (Stripe)
// =============================

export interface CheckoutResponse {
  sessionId: string;
  sessionUrl: string;
  amount: number;
  currency: string;
  platformFee: number;
  netToCreator: number;
}

export interface ConnectStatus {
  connected: boolean;
  onboarded: boolean;
  dashboardUrl: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted?: boolean;
}

export interface ConnectOnboardingResponse {
  accountId: string;
  onboardingUrl: string;
  expiresAt: string;
}

export const payments = {
  createCheckout(dealId: string, milestoneId?: string): Promise<CheckoutResponse> {
    return request("/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ dealId, milestoneId }),
    });
  },

  getConnectStatus(): Promise<ConnectStatus> {
    return request("/stripe/connect");
  },

  startConnectOnboarding(country?: string): Promise<ConnectOnboardingResponse> {
    return request("/stripe/connect", {
      method: "POST",
      body: JSON.stringify({ country }),
    });
  },
};

// =============================
// CONVENIENCE: Default export
// =============================

const api = {
  campaigns,
  applications,
  deals,
  creators,
  brands,
  dashboard,
  profile,
  notifications,
  messages,
  reviews,
  upload,
  payments,
};

export default api;
