// CreatorHub — E2E Auth Flow Tests
// Tests sign-in, sign-up, onboarding, and role-based routing.

import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("sign-in page renders correctly", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("h1, [data-testid='sign-in-heading']")).toBeVisible();
  });

  test("sign-up page renders correctly", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.locator("h1, [data-testid='sign-up-heading']")).toBeVisible();
  });
});

test.describe("Onboarding", () => {
  // These tests require a test user authenticated via Clerk test helpers
  // In CI, use CLERK_TESTING_TOKEN or Clerk's test mode

  test.skip("creator onboarding flow", async ({ page }) => {
    // Step 1: Role selection
    await page.goto("/onboarding");
    await page.click("[data-testid='role-creator']");
    await page.click("[data-testid='onboarding-next']");

    // Step 2: Profile details
    await page.fill("[name='displayName']", "TestCreator");
    await page.fill("[name='bio']", "Test bio for e2e testing");
    await page.selectOption("[name='country']", "US");
    await page.click("[data-testid='onboarding-next']");

    // Step 3: Roles & Categories
    await page.click("[data-testid='role-UGC_CREATOR']");
    await page.click("[data-testid='onboarding-next']");

    // Step 4: Social accounts (skip)
    await page.click("[data-testid='onboarding-skip']");

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test.skip("brand onboarding flow", async ({ page }) => {
    await page.goto("/onboarding");
    await page.click("[data-testid='role-brand']");
    await page.click("[data-testid='onboarding-next']");

    await page.fill("[name='companyName']", "TestBrand Inc");
    await page.fill("[name='industry']", "Technology");
    await page.fill("[name='website']", "https://testbrand.com");
    await page.click("[data-testid='onboarding-next']");

    await expect(page).toHaveURL(/dashboard/);
  });
});
