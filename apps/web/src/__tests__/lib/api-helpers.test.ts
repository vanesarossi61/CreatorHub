// CreatorHub — API Helpers Tests
// Tests for response helpers, pagination, slug generation, and error handling.

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  apiSuccess,
  apiError,
  apiCreated,
  generateSlug,
  getPagination,
  ApiAuthError,
  ApiForbiddenError,
  ApiNotFoundError,
  handleApiError,
} from "@/lib/api-helpers";
import { ZodError, z } from "zod";

// =============================
// Response Helpers
// =============================

describe("apiSuccess", () => {
  it("returns 200 with data by default", async () => {
    const res = apiSuccess({ name: "test" });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.name).toBe("test");
  });

  it("allows custom status code", async () => {
    const res = apiSuccess("ok", 202);
    expect(res.status).toBe(202);
  });
});

describe("apiError", () => {
  it("returns error response with status", async () => {
    const res = apiError("Something went wrong", 422);
    const json = await res.json();
    expect(res.status).toBe(422);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Something went wrong");
  });

  it("defaults to 400", async () => {
    const res = apiError("Bad request");
    expect(res.status).toBe(400);
  });
});

describe("apiCreated", () => {
  it("returns 201 with data", async () => {
    const res = apiCreated({ id: "123" });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("123");
  });
});

// =============================
// Slug Generation
// =============================

describe("generateSlug", () => {
  it("converts text to lowercase slug", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  it("removes accents", () => {
    expect(generateSlug("Cafe Latte")).toBe("cafe-latte");
    expect(generateSlug("Diseno Grafico")).toBe("diseno-grafico");
  });

  it("removes special characters", () => {
    expect(generateSlug("Hello @#$ World!")).toBe("hello-world");
  });

  it("trims leading/trailing hyphens", () => {
    expect(generateSlug("---hello---")).toBe("hello");
  });

  it("limits length to 60 characters", () => {
    const long = "a".repeat(100);
    expect(generateSlug(long).length).toBeLessThanOrEqual(60);
  });

  it("handles empty string", () => {
    expect(generateSlug("")).toBe("");
  });

  it("collapses multiple hyphens", () => {
    expect(generateSlug("hello   world")).toBe("hello-world");
  });
});

// =============================
// Pagination
// =============================

describe("getPagination", () => {
  function makeReq(url: string): any {
    return { url: `http://localhost:3000${url}` } as any;
  }

  it("returns defaults when no params", () => {
    const p = getPagination(makeReq("/api/test"));
    expect(p.page).toBe(1);
    expect(p.pageSize).toBe(20);
    expect(p.skip).toBe(0);
  });

  it("parses page and pageSize", () => {
    const p = getPagination(makeReq("/api/test?page=3&pageSize=10"));
    expect(p.page).toBe(3);
    expect(p.pageSize).toBe(10);
    expect(p.skip).toBe(20);
  });

  it("clamps page to minimum 1", () => {
    const p = getPagination(makeReq("/api/test?page=-5"));
    expect(p.page).toBe(1);
  });

  it("clamps pageSize to maxPageSize", () => {
    const p = getPagination(makeReq("/api/test?pageSize=999"));
    expect(p.pageSize).toBe(50);
  });

  it("respects custom maxPageSize", () => {
    const p = getPagination(makeReq("/api/test?pageSize=15"), 10);
    expect(p.pageSize).toBe(10);
  });
});

// =============================
// Error Classes
// =============================

describe("API Error Classes", () => {
  it("ApiAuthError has correct name and default message", () => {
    const err = new ApiAuthError();
    expect(err.name).toBe("ApiAuthError");
    expect(err.message).toBe("Not authenticated");
  });

  it("ApiForbiddenError has correct name", () => {
    const err = new ApiForbiddenError("Custom message");
    expect(err.name).toBe("ApiForbiddenError");
    expect(err.message).toBe("Custom message");
  });

  it("ApiNotFoundError includes resource name", () => {
    const err = new ApiNotFoundError("Campaign");
    expect(err.message).toBe("Campaign not found");
  });
});

// =============================
// Global Error Handler
// =============================

describe("handleApiError", () => {
  it("handles ZodError with 422", async () => {
    const schema = z.object({ name: z.string() });
    try {
      schema.parse({ name: 123 });
    } catch (e) {
      const res = handleApiError(e);
      expect(res.status).toBe(422);
    }
  });

  it("handles ApiAuthError with 401", async () => {
    const res = handleApiError(new ApiAuthError());
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error).toBe("Not authenticated");
  });

  it("handles ApiForbiddenError with 403", async () => {
    const res = handleApiError(new ApiForbiddenError());
    expect(res.status).toBe(403);
  });

  it("handles ApiNotFoundError with 404", async () => {
    const res = handleApiError(new ApiNotFoundError("User"));
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error).toBe("User not found");
  });

  it("handles unknown errors with 500", async () => {
    const res = handleApiError(new Error("random crash"));
    expect(res.status).toBe(500);
  });
});
