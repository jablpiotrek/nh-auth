import { expect, test } from "@nuxt/test-utils/playwright";

test("home page redirects to login when not logged in", async ({ page, goto }) => {
  await goto("/", { waitUntil: "hydration" });
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("#__nuxt")).not.toBeEmpty();
});

test("login then logout round-trip", async ({ page, goto }) => {
  // No backend runs in this CI job, so stub the three calls the login ->
  // home -> logout round-trip makes instead of hitting a real API.
  await page.route("**/auth/login", (route) =>
    route.fulfill({ json: { access_token: "test-access-token", token_type: "bearer" } }),
  );
  await page.route("**/users/me", (route) =>
    route.fulfill({
      json: {
        id: "test-user-id",
        email: "user@example.com",
        created_at: new Date().toISOString(),
        subscribed: false,
      },
    }),
  );
  await page.route("**/auth/logout", (route) => route.fulfill({ status: 204 }));

  await goto("/login", { waitUntil: "hydration" });

  await page.locator("#login-email input").fill("user@example.com");
  await page.locator("#login-password input").fill("Secret123!");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Welcome user@example.com")).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
