import { test, expect } from "./fixtures.js";

/**
 * Achievement system tests
 */

test.describe("Achievements System", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pages/achievements.html");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should load achievements page", async ({ page }) => {
    await expect(page).toHaveTitle(/Achievements/i);
  });

  test("should persist achievement data in localStorage", async ({ page }) => {
    const achievementData = await page.evaluate(() => {
      return localStorage.getItem("nerdtype_achievements");
    });

    expect(achievementData).toBeTruthy();
  });
});
