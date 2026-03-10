// CreatorHub — Test Setup
// Global test configuration and mocks for Vitest.

import { vi } from "vitest";

// =============================
// MOCK: @clerk/nextjs/server
// =============================

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_test_123" }),
  currentUser: vi.fn().mockResolvedValue({
    id: "clerk_test_123",
    emailAddresses: [{ emailAddress: "test@example.com" }],
    firstName: "Test",
    lastName: "User",
    imageUrl: null,
  }),
}));

// =============================
// MOCK: @creatorhub/database (Prisma)
// =============================

const mockPrismaModel = () => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  count: vi.fn().mockResolvedValue(0),
  groupBy: vi.fn().mockResolvedValue([]),
  aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }),
  upsert: vi.fn(),
});

export const prismaMock = {
  user: mockPrismaModel(),
  creator: mockPrismaModel(),
  brand: mockPrismaModel(),
  campaign: mockPrismaModel(),
  application: mockPrismaModel(),
  deal: mockPrismaModel(),
  milestone: mockPrismaModel(),
  payout: mockPrismaModel(),
  deliverable: mockPrismaModel(),
  notification: mockPrismaModel(),
  message: mockPrismaModel(),
  review: mockPrismaModel(),
  socialAccount: mockPrismaModel(),
  portfolioItem: mockPrismaModel(),
  $transaction: vi.fn((fn: any) => fn(prismaMock)),
};

vi.mock("@creatorhub/database", () => ({
  prisma: prismaMock,
}));

// =============================
// MOCK: next/navigation
// =============================

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => "/"),
}));

// =============================
// MOCK: next/server (minimal)
// =============================

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })),
  headers: vi.fn(() => new Headers()),
}));

// =============================
// ENV DEFAULTS
// =============================

process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_mock";
process.env.ADMIN_EMAILS = "admin@test.com";
process.env.RESEND_API_KEY = "re_test_mock";
process.env.PLATFORM_COMMISSION_RATE = "0.12";

// =============================
// HELPERS
// =============================

export function resetAllMocks() {
  Object.values(prismaMock).forEach((model) => {
    if (typeof model === "object" && model !== null) {
      Object.values(model).forEach((fn) => {
        if (typeof fn === "function" && "mockReset" in fn) {
          (fn as any).mockReset();
        }
      });
    }
  });
}

/** Create a mock NextRequest */
export function mockRequest(
  url: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
): Request {
  const { method = "GET", body, headers = {} } = options;
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json", ...headers },
  };
  if (body) init.body = JSON.stringify(body);
  return new Request(`http://localhost:3000${url}`, init);
}
