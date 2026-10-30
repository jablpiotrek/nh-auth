import { expect, test } from "@nuxt/test-utils/playwright";

test("home page redirects to login when not logged in", async ({ page, goto }) => {
  await goto("/", { waitUntil: "hydration" });
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("#__nuxt")).not.toBeEmpty();
});
