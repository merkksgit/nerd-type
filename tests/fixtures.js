import { test as base } from "@playwright/test";

/**
 * Test fixture that bypasses authentication for NerdType tests
 */
export const test = base.extend({
  page: async ({ page, context }, use) => {
    await context.addInitScript(() => {
      localStorage.setItem("nerdtype_auth_checked", "true");
      localStorage.removeItem("nerdtype_hide_ui");
    });

    await use(page);
  },
});

export { expect } from "@playwright/test";
