import { expect, test } from "@nuxt/test-utils/playwright";

test("toggling the notifications checkbox on the account page saves the change", async ({
  page,
  goto,
}) => {
  // No backend runs in this CI job, so stub the calls this flow makes
  // instead of hitting a real API.
  await page.route("**/auth/login", (route) =>
    route.fulfill({ json: { access_token: "test-access-token", token_type: "bearer" } }),
  );
  await page.route("**/users/me", (route) => {
    if (route.request().method() === "PATCH") {
      return route.fulfill({
        json: {
          id: "test-user-id",
          email: "user@example.com",
          created_at: new Date().toISOString(),
          subscribed: true,
        },
      });
    }
    return route.fulfill({
      json: {
        id: "test-user-id",
        email: "user@example.com",
        created_at: new Date().toISOString(),
        subscribed: false,
      },
    });
  });

  await goto("/login", { waitUntil: "hydration" });
  await page.locator("#login-email input").fill("user@example.com");
  await page.locator("#login-password input").fill("Secret123!");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/$/);

  const subscribeCheckbox = page.locator("#account-subscribe input");
  await expect(subscribeCheckbox).not.toBeChecked();

  await subscribeCheckbox.check();

  await expect(subscribeCheckbox).toBeChecked();
});
