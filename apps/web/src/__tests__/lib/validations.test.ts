// CreatorHub — Validation Schema Tests
// Tests for Zod validation schemas used in forms and API routes.

import { describe, it, expect } from "vitest";
import { validateForm } from "@/lib/validations";
import { z } from "zod";
import {
  campaignCreateSchema,
  applicationCreateSchema,
  reviewCreateSchema,
} from "@creatorhub/shared";

// =============================
// validateForm helper
// =============================

describe("validateForm", () => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    age: z.number().min(18).optional(),
  });

  it("returns success with valid data", () => {
    const result = validateForm(schema, {
      name: "John",
      email: "john@example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("John");
      expect(result.data.email).toBe("john@example.com");
    }
  });

  it("returns errors for invalid data", () => {
    const result = validateForm(schema, {
      name: "J",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveProperty("name");
      expect(result.errors).toHaveProperty("email");
    }
  });

  it("returns errors for missing required fields", () => {
    const result = validateForm(schema, {});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveProperty("name");
      expect(result.errors).toHaveProperty("email");
    }
  });

  it("allows optional fields to be omitted", () => {
    const result = validateForm(schema, {
      name: "John",
      email: "john@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("validates optional fields when provided", () => {
    const result = validateForm(schema, {
      name: "John",
      email: "john@example.com",
      age: 15,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveProperty("age");
    }
  });
});

// =============================
// Campaign Create Schema
// =============================

describe("campaignCreateSchema", () => {
  const validCampaign = {
    title: "Summer Campaign 2026",
    description: "Looking for lifestyle creators for our summer collection",
    budget: 5000,
    currency: "USD",
    dealType: "FIXED",
    category: "LIFESTYLE",
    maxCreators: 5,
  };

  it("accepts valid campaign data", () => {
    const result = campaignCreateSchema.safeParse(validCampaign);
    expect(result.success).toBe(true);
  });

  it("rejects campaign without title", () => {
    const { title, ...rest } = validCampaign;
    const result = campaignCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects negative budget", () => {
    const result = campaignCreateSchema.safeParse({
      ...validCampaign,
      budget: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero budget", () => {
    const result = campaignCreateSchema.safeParse({
      ...validCampaign,
      budget: 0,
    });
    expect(result.success).toBe(false);
  });
});

// =============================
// Application Create Schema
// =============================

describe("applicationCreateSchema", () => {
  const validApp = {
    campaignId: "campaign_123",
    coverLetter: "I would love to work on this campaign because...",
    proposedRate: 500,
  };

  it("accepts valid application", () => {
    const result = applicationCreateSchema.safeParse(validApp);
    expect(result.success).toBe(true);
  });

  it("rejects application without campaignId", () => {
    const { campaignId, ...rest } = validApp;
    const result = applicationCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("accepts application without optional proposedRate", () => {
    const { proposedRate, ...rest } = validApp;
    const result = applicationCreateSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });
});

// =============================
// Review Create Schema
// =============================

describe("reviewCreateSchema", () => {
  const validReview = {
    dealId: "deal_123",
    rating: 5,
    text: "Great experience working with this creator!",
  };

  it("accepts valid review", () => {
    const result = reviewCreateSchema.safeParse(validReview);
    expect(result.success).toBe(true);
  });

  it("rejects rating above 5", () => {
    const result = reviewCreateSchema.safeParse({
      ...validReview,
      rating: 6,
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating below 1", () => {
    const result = reviewCreateSchema.safeParse({
      ...validReview,
      rating: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects review without dealId", () => {
    const { dealId, ...rest } = validReview;
    const result = reviewCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
