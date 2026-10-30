import { expect, test } from "@nuxt/test-utils/playwright";

test("registering creates an account and lands on the account page", async ({ page, goto }) => {
  // No backend runs in this CI job, so stub the calls this flow makes
  // instead of hitting a real API.
  await page.route("**/auth/register", (route) =>
    route.fulfill({ json: { access_token: "test-access-token", token_type: "bearer" } }),
  );
  await page.route("**/users/me", (route) =>
    route.fulfill({
      json: {
        id: "test-user-id",
        email: "newuser@example.com",
        created_at: new Date().toISOString(),
        subscribed: true,
      },
    }),
  );

  await goto("/register", { waitUntil: "hydration" });

  await page.locator("#register-email input").fill("newuser@example.com");
  await page.locator("#register-password input").fill("Correct-Horse-9");
  await page.locator("#register-repeat-password input").fill("Correct-Horse-9");
  await page.locator("#register-subscribe input").check();
  await page.getByRole("button", { name: "Register" }).click();

  await expect(page).toHaveURL(/\/register-success$/);

  await page.getByRole("button", { name: "Go to my page" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Welcome newuser@example.com")).toBeVisible();
});

test("register shows a validation error for a password missing a character class", async ({
  page,
  goto,
}) => {
  await goto("/register", { waitUntil: "hydration" });

  await page.locator("#register-password input").fill("alllowercase");
  await page.locator("#register-password input").blur();

  await expect(
    page.getByText("Password must contain at least one uppercase letter."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Register" })).toBeDisabled();
});
