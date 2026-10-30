import { expect, test } from "@nuxt/test-utils/playwright";

// No backend runs in this CI job, so stub the calls each flow makes
// instead of hitting a real API.

test("login then logout round-trip", async ({ page, goto }) => {
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

test("login shows an error for the wrong password instead of logging in", async ({
  page,
  goto,
}) => {
  await page.route("**/auth/login", (route) =>
    route.fulfill({ status: 401, json: { detail: "errors.auth.invalidCredentials" } }),
  );

  await goto("/login", { waitUntil: "hydration" });

  await page.locator("#login-email input").fill("user@example.com");
  await page.locator("#login-password input").fill("WrongPassword1!");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
