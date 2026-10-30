import { expect, test } from "@nuxt/test-utils/playwright";

test("home page redirects to login when not logged in", async ({ page, goto }) => {
  await goto("/", { waitUntil: "hydration" });
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("#__nuxt")).not.toBeEmpty();
});

test("login then logout round-trip", async ({ page, goto }) => {
  await goto("/login", { waitUntil: "hydration" });

  await page.locator("#login-email input").fill("user@example.com");
  await page.locator("#login-password input").fill("Secret123!");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Welcome user@example.com")).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
