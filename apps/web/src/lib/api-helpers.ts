// CreatorHub — API Route Helpers
// Shared utilities for all API routes: validation, error handling, pagination.

import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@creatorhub/database";
import type { ApiResponse, PaginatedResponse } from "@creatorhub/shared";

// =============================
// RESPONSE HELPERS
// =============================

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(error: string, status = 400): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error }, { status });
}

export function apiCreated<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

// =============================
// VALIDATION
// =============================

export async function parseBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  const body = await req.json();
  return schema.parse(body);
}

export function handleZodError(error: ZodError): NextResponse<ApiResponse> {
  const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
  return apiError(`Validation failed: ${messages.join(", ")}`, 422);
}

// =============================
// AUTH HELPERS FOR API ROUTES
// =============================

export async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { creator: true, brand: true, agency: true },
  });

  return user;
}

export async function requireAuthUser() {
  const user = await getAuthenticatedUser();
  if (!user) throw new ApiAuthError("Not authenticated");
  return user;
}

export async function requireBrand() {
  const user = await requireAuthUser();
  if (user.type !== "BRAND" || !user.brand) {
    throw new ApiForbiddenError("Only brands can perform this action");
  }
  return { user, brand: user.brand };
}

export async function requireCreator() {
  const user = await requireAuthUser();
  if (user.type !== "CREATOR" || !user.creator) {
    throw new ApiForbiddenError("Only creators can perform this action");
  }
  return { user, creator: user.creator };
}

// =============================
// PAGINATION
// =============================

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
}

export function getPagination(req: NextRequest, maxPageSize = 50): PaginationParams {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10))
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): NextResponse<ApiResponse<PaginatedResponse<T>>> {
  return apiSuccess({
    data,
    total,
    page: params.page,
    pageSize: params.pageSize,
    hasMore: params.skip + params.pageSize < total,
  });
}

// =============================
// SLUG GENERATION
// =============================

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function uniqueSlug(
  base: string,
  model: "campaign" | "creator" | "brand" | "agency"
): Promise<string> {
  let slug = generateSlug(base);
  let suffix = 0;
  const table = prisma[model] as any;

  while (await table.findUnique({ where: { slug } })) {
    suffix++;
    slug = `${generateSlug(base)}-${suffix}`;
  }

  return slug;
}

// =============================
// ERROR CLASSES
// =============================

export class ApiAuthError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "ApiAuthError";
  }
}

export class ApiForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ApiForbiddenError";
  }
}

export class ApiNotFoundError extends Error {
  constructor(resource = "Resource") {
    super(`${resource} not found`);
    this.name = "ApiNotFoundError";
  }
}

// =============================
// GLOBAL ERROR HANDLER
// =============================

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  if (error instanceof ZodError) return handleZodError(error);
  if (error instanceof ApiAuthError) return apiError(error.message, 401);
  if (error instanceof ApiForbiddenError) return apiError(error.message, 403);
  if (error instanceof ApiNotFoundError) return apiError(error.message, 404);

  console.error("[API Error]", error);
  return apiError("Internal server error", 500);
}
