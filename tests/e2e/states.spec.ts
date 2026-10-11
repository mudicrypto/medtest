import { expect, test } from "@playwright/test";

// Offline handling, at laptop and phone sizes. Going offline only affects this
// test's browser, so it can run alongside the other tests.

test("offline: a clear notice, a retryable answer, and recovery on reconnect", async ({ page, context }) => {
  await page.goto("/questions/q-pulm-01");
  const main = page.getByRole("main");
  await expect(main.getByRole("button", { name: "Check answer" })).toBeVisible();
  await expect(page.getByText("You're offline")).toHaveCount(0);

  await context.setOffline(true);
  await expect(main.getByRole("status").filter({ hasText: "You're offline" })).toBeVisible();

  // Checking an answer fails with a message instead of hanging or losing the choice.
  await main.locator("label:has(input[type=radio][value=A])").click();
  await main.getByRole("button", { name: "Check answer" }).click();
  await expect(main.getByRole("alert").filter({ hasText: "We couldn't check your answer" })).toBeVisible();
  await expect(main.locator("input[type=radio][value=A]")).toBeChecked();

  // Back online: the notice goes and the same answer can be checked.
  await context.setOffline(false);
  await expect(page.getByText("You're offline")).toHaveCount(0);
  await main.getByRole("button", { name: "Check answer" }).click();
  await expect(main.getByRole("heading", { name: "Explanation" })).toBeVisible();
});
