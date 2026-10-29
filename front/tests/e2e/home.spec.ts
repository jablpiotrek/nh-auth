import { expect, test } from "@nuxt/test-utils/playwright";

test("home page renders", async ({ page, goto }) => {
  await goto("/", { waitUntil: "hydration" });
  await expect(page.locator("#__nuxt")).not.toBeEmpty();
});
