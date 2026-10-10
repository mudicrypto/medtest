import { expect, test as setup } from "@playwright/test";
import { createConfirmedUser, PASSWORD, uniqueEmail } from "./helpers";

export const STORAGE = "playwright/.auth/student.json";

// Signs in one test student through the real login form and saves the
// session, so the other tests start signed in.
setup("sign in test student", async ({ page }) => {
  const email = uniqueEmail("student");
  await createConfirmedUser(email, "Test Student");
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: STORAGE });
});
