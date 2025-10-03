import { test, expect } from "./fixtures.js";

/**
 * Basic game functionality tests for NerdType
 */

test.describe("Game Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pages/game.html");
    await page.waitForSelector("#game", { state: "visible", timeout: 15000 });
  });

  test("should load game page successfully", async ({ page }) => {
    await expect(page).toHaveTitle(/NerdType/i);
    await expect(page.locator("#game")).toBeVisible();
    await expect(page.locator("#userInput")).toBeVisible();
  });

  test("should display current word to type", async ({ page }) => {
    const wordToType = page.locator("#wordToType");
    await expect(wordToType).toBeVisible();
    await expect(wordToType).not.toBeEmpty();
  });

  test("should accept typed input", async ({ page }) => {
    const input = page.locator("#userInput");
    await expect(input).toBeVisible();
    await input.fill("test");
    await expect(input).toHaveValue("test");
  });

  test("should show timer", async ({ page }) => {
    const timer = page.locator("#timer");
    await expect(timer).toBeVisible();
  });
});

test.describe("Gameplay Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pages/game.html");
    await page.waitForSelector("#game", { state: "visible", timeout: 15000 });
  });

  test("should complete typing a word and advance", async ({ page }) => {
    const currentWordSelector = "#wordToType .word.current";
    const input = page.locator("#userInput");

    const firstWord = await page.locator(currentWordSelector).evaluate((el) => {
      const letters = el.querySelectorAll(".letter");
      return Array.from(letters)
        .map((l) => l.textContent)
        .join("")
        .trim();
    });

    await input.fill(firstWord);
    await input.press("Space");

    await page.waitForTimeout(300);

    const secondWord = await page.locator(currentWordSelector).evaluate((el) => {
      const letters = el.querySelectorAll(".letter");
      return Array.from(letters)
        .map((l) => l.textContent)
        .join("")
        .trim();
    });

    expect(secondWord).toBeTruthy();
    expect(secondWord.length).toBeGreaterThan(0);
  });

  test("should type multiple words in sequence", async ({ page }) => {
    const currentWordSelector = "#wordToType .word.current";
    const input = page.locator("#userInput");
    const wordsTyped = [];

    for (let i = 0; i < 3; i++) {
      const currentWord = await page
        .locator(currentWordSelector)
        .evaluate((el) => {
          const letters = el.querySelectorAll(".letter");
          return Array.from(letters)
            .map((l) => l.textContent)
            .join("")
            .trim();
        });

      if (currentWord) {
        wordsTyped.push(currentWord);
        await input.clear();
        await input.fill(currentWord);
        await input.press("Space");
        await page.waitForTimeout(200);
      }
    }

    expect(wordsTyped.length).toBe(3);
    expect(wordsTyped.every((w) => w.length > 0)).toBe(true);
  });

  test("should handle text input and display words", async ({ page }) => {
    const currentWordSelector = "#wordToType .word.current";
    const input = page.locator("#userInput");

    const word = await page.locator(currentWordSelector).evaluate((el) => {
      const letters = el.querySelectorAll(".letter");
      return Array.from(letters)
        .map((l) => l.textContent)
        .join("")
        .trim();
    });

    expect(word).toBeTruthy();
    expect(word.length).toBeGreaterThan(0);

    await input.clear();
    await input.fill("test");
    await expect(input).toHaveValue("test");
  });
});

test.describe("Mobile Responsiveness", () => {
  test("should be playable on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/pages/game.html");
    await page.waitForSelector("#game", { state: "visible", timeout: 15000 });

    await expect(page.locator("#game")).toBeVisible();
    await expect(page.locator("#userInput")).toBeVisible();
  });
});
