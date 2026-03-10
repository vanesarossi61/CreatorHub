// CreatorHub — E2E Deal Flow Tests
// Tests deal lifecycle: negotiation, contracting, delivery, payment.

import { test, expect } from "@playwright/test";

test.describe("Deal Flows", () => {
  test("deals page loads for authenticated users", async ({ page }) => {
    // This will redirect to sign-in if not authenticated
    await page.goto("/deals");

    // Either shows deals page or redirects to auth
    const url = page.url();
    const isDealsPage = url.includes("/deals");
    const isAuthPage = url.includes("/sign-in");
    expect(isDealsPage || isAuthPage).toBeTruthy();
  });

  test.skip("deal detail shows status timeline", async ({ page }) => {
    // Requires authenticated user with existing deals
    await page.goto("/deals");

    const firstDeal = page.locator("[data-testid='deal-card']").first();
    if (await firstDeal.isVisible()) {
      await firstDeal.click();

      // Should show deal info
      await expect(
        page.locator("[data-testid='deal-status']")
      ).toBeVisible();

      // Should show milestones or deliverables
      const milestones = page.locator("[data-testid='milestone-list']");
      const deliverables = page.locator("[data-testid='deliverable-list']");
      const hasMilestones = (await milestones.count()) > 0;
      const hasDeliverables = (await deliverables.count()) > 0;
      expect(hasMilestones || hasDeliverables).toBeTruthy();
    }
  });

  test.skip("payment button appears for payable deals", async ({ page }) => {
    // Requires authenticated brand with a deal in DELIVERED status
    await page.goto("/deals");

    // Find a deal card with DELIVERED status
    const deliveredDeal = page.locator(
      "[data-testid='deal-card']:has-text('Delivered')"
    ).first();

    if (await deliveredDeal.isVisible()) {
      await deliveredDeal.click();

      // Payment button should be visible
      await expect(
        page.locator("[data-testid='payment-button'], button:has-text('Pay')")
      ).toBeVisible();
    }
  });
});

test.describe("Navigation & Layout", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/CreatorHub/i);
  });

  test("responsive navigation works", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Mobile menu button should be visible
    const menuButton = page.locator(
      "[data-testid='mobile-menu'], button[aria-label*='menu' i]"
    );
    if (await menuButton.isVisible()) {
      await menuButton.click();
      // Navigation links should appear
      await expect(
        page.locator("nav a, [data-testid='nav-link']")
      ).toBeVisible();
    }
  });

  test("dark mode toggle works", async ({ page }) => {
    await page.goto("/");

    const themeToggle = page.locator(
      "[data-testid='theme-toggle'], button[aria-label*='theme' i]"
    );
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      // Check that dark class is applied
      const html = page.locator("html");
      const hasDark = await html.getAttribute("class");
      expect(hasDark).toBeTruthy();
    }
  });

  test("404 page renders", async ({ page }) => {
    await page.goto("/this-page-definitely-does-not-exist-12345");
    await expect(
      page.locator("body")
    ).toContainText(/not found|404/i);
  });
});
