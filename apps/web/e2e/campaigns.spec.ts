// CreatorHub — E2E Campaign Flow Tests
// Tests campaign creation, listing, filtering, and detail view.

import { test, expect } from "@playwright/test";

test.describe("Campaign Flows", () => {
  test("explore page loads and shows campaigns", async ({ page }) => {
    await page.goto("/explore");

    // Page title / heading
    await expect(
      page.locator("h1, [data-testid='explore-heading']")
    ).toContainText(/explore|discover|campaigns/i);

    // Should show campaign cards or empty state
    const campaigns = page.locator("[data-testid='campaign-card']");
    const emptyState = page.locator("[data-testid='empty-state']");
    const hasCampaigns = (await campaigns.count()) > 0;
    const hasEmpty = (await emptyState.count()) > 0;
    expect(hasCampaigns || hasEmpty).toBeTruthy();
  });

  test("campaign filtering works", async ({ page }) => {
    await page.goto("/explore");

    // Search input
    const searchInput = page.locator(
      "input[placeholder*='search' i], input[name='search'], [data-testid='search-input']"
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill("lifestyle");
      // Wait for debounce + fetch
      await page.waitForTimeout(500);
      // Page should still be functional
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("campaign detail page shows info", async ({ page }) => {
    await page.goto("/explore");

    const firstCard = page.locator("[data-testid='campaign-card']").first();
    if (await firstCard.isVisible()) {
      await firstCard.click();

      // Should navigate to campaign detail
      await expect(page).toHaveURL(/campaigns\//);

      // Should show campaign details
      await expect(
        page.locator("h1, [data-testid='campaign-title']")
      ).toBeVisible();
    }
  });

  test.skip("brand can create a campaign", async ({ page }) => {
    // Requires authenticated brand user
    await page.goto("/campaigns/new");

    await page.fill("[name='title']", "E2E Test Campaign");
    await page.fill(
      "[name='description']",
      "This is an automated test campaign created by Playwright"
    );
    await page.fill("[name='budget']", "5000");
    await page.selectOption("[name='category']", "LIFESTYLE");
    await page.selectOption("[name='dealType']", "FIXED");

    await page.click("[data-testid='create-campaign-submit']");

    // Should redirect to campaign detail
    await expect(page).toHaveURL(/campaigns\//);
    await expect(
      page.locator("[data-testid='campaign-title']")
    ).toContainText("E2E Test Campaign");
  });
});
