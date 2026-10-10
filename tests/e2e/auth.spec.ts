import { expect, test, type Page } from "@playwright/test";
import { createConfirmedUser, latestEmailLink, PASSWORD, uniqueEmail } from "./helpers";

// Next.js adds its own role="alert" route announcer; match only ours.
const formAlert = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');

async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("signed-out visitors are sent to sign in, then back to where they were going", async ({ page }) => {
  const email = uniqueEmail("redirect");
  await createConfirmedUser(email, "Redirect Tester");

  await page.goto("/practice/session?n=5");
  await expect(page).toHaveURL(/\/login\?next=%2Fpractice%2Fsession%3Fn%3D5/);
  await signIn(page, email);
  await expect(page).toHaveURL(/\/practice\/session\?n=5$/);

  // Signed-in users skip the sign-in page.
  await page.goto("/login");
  await expect(page).toHaveURL(/\/dashboard/);
});

test("sign-up → confirmation email → dashboard with the student's name", async ({ page }) => {
  const email = uniqueEmail("signup");
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Maria Petrova");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  // Before confirming, signing in is refused with a clear message.
  await page.goto("/login");
  await signIn(page, email);
  await expect(formAlert(page)).toContainText("confirm your email");

  // Open the link from the email (captured by the local test mailbox).
  await page.goto(await latestEmailLink(email, "confirm"));
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome back, Maria");
  await expect(page.getByTestId("account-name").first()).toHaveText("Maria Petrova");
});

test("sign-up form explains invalid input", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("A");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("Include at least one number.")).toBeVisible();
  // What was typed is kept (except the password).
  await expect(page.getByLabel("Your name")).toHaveValue("A");
});

test("wrong password shows a friendly error", async ({ page }) => {
  const email = uniqueEmail("wrongpw");
  await createConfirmedUser(email, "Wrong Password");
  await page.goto("/login");
  await signIn(page, email, "NotTheRightOne1");
  await expect(formAlert(page)).toContainText("don't match");
  await expect(page).toHaveURL(/\/login/);
});

test("sign out ends the session", async ({ page }) => {
  const email = uniqueEmail("signout");
  await createConfirmedUser(email, "Sign Out");
  await page.goto("/login");
  await signIn(page, email);
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/login\?notice=signed-out/);
  await expect(page.getByText("You've been signed out.")).toBeVisible();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("forgot password → email link → new password works", async ({ page }) => {
  const email = uniqueEmail("reset");
  await createConfirmedUser(email, "Reset Tester");
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText(email);

  await page.goto(await latestEmailLink(email, "reset"));
  await expect(page).toHaveURL(/\/reset-password/);
  const newPassword = "BrandNew2026";
  await page.getByLabel("New password", { exact: true }).fill(newPassword);
  await page.getByLabel("Repeat new password").fill(newPassword);
  await page.getByRole("button", { name: "Save password" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/login/);
  await signIn(page, email, PASSWORD);
  await expect(formAlert(page)).toContainText("don't match"); // old password no longer works
  await signIn(page, email, newPassword);
  await expect(page).toHaveURL(/\/dashboard/);
});

test("settings: name and exam date are saved to the account", async ({ page }) => {
  const email = uniqueEmail("settings");
  await createConfirmedUser(email, "Settings Tester");
  await page.goto("/login");
  await signIn(page, email);
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto("/settings");

  const inThirty = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel("Name", { exact: true }).fill("Dr. Amina Yusuf");
  await page.getByLabel("Target exam date").fill(inThirty);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
  await expect(page.getByTestId("account-name").first()).toHaveText("Dr. Amina Yusuf");

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome back, Dr.");
  await expect(page.getByText(/(29|30) days until your exam/)).toBeVisible();

  // Survives a fresh sign-in.
  await page.reload();
  await expect(page.getByTestId("account-name").first()).toHaveText("Dr. Amina Yusuf");
});

test("sign-in ignores off-site redirect targets", async ({ page }) => {
  const email = uniqueEmail("nextcheck");
  await createConfirmedUser(email, "Next Check");
  await page.goto("/login?next=//evil.example.com/steal");
  await signIn(page, email);
  await expect(page).toHaveURL("http://localhost:3100/dashboard");
});
