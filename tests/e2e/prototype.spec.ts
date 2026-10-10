import { expect, test, type Page } from "@playwright/test";

const pages = [
  "/",
  "/login",
  "/dashboard",
  "/practice",
  "/practice/session?n=5",
  "/review",
  "/review/mistakes",
  "/bookmarks",
  "/mock-exams",
  "/mock-exams/run?b=demo-quick",
  "/terminology",
  "/analytics",
  "/tutor",
  "/questions/q-card-01",
];

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return errors;
}

for (const path of pages) {
  test(`${path} renders without errors or horizontal scroll`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeAttached();
    // Let the client store load.
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "page scrolls horizontally").toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test("practice flow: answer, see explanation, bookmark, finish", async ({ page }) => {
  await page.goto("/practice");
  await page.getByRole("button", { name: /Cardiology/ }).click();
  await page.getByRole("radio", { name: "5" }).click();
  await page.getByRole("button", { name: "Start practice" }).click();

  await expect(page).toHaveURL(/practice\/session/);
  await expect(page.getByText("DEMO — not for study").first()).toBeVisible();
  const check = page.getByRole("button", { name: "Check answer" });
  await expect(check).toBeDisabled();
  await page.locator("label", { hasText: /^B/ }).first().click();
  await check.click();
  await expect(page.getByRole("heading", { name: "Explanation" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(/Correct|Not quite/);

  await page.getByRole("button", { name: "Bookmark question" }).click();
  await expect(page.getByRole("button", { name: "Remove bookmark" })).toBeVisible();

  // Two cardiology demo questions exist, so the session has two.
  await page.getByRole("button", { name: "Next question" }).click();
  await page.keyboard.press("1");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByText("Session complete")).toBeVisible();
});

test("AI tutor drawer answers with question context", async ({ page }) => {
  await page.goto("/questions/q-neuro-02");
  await page.locator("label", { hasText: "Right middle cerebral artery" }).click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.getByRole("button", { name: "Ask the tutor" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Why is my answer wrong?" }).click();
  await expect(dialog.getByText(/You chose A .* The key answer is B/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("mock exam: answer, submit, see demo-labelled results", async ({ page }) => {
  await page.goto("/mock-exams/run?b=demo-quick");
  await expect(page.getByRole("timer")).toBeVisible();
  await page.locator("fieldset label").first().click();
  await expect(page.getByText("1 of 6 answered")).toBeVisible();
  await page.getByRole("button", { name: "Submit", exact: true }).first().click();
  await expect(page.getByRole("dialog")).toContainText("5 unanswered questions");
  await page.getByRole("dialog").getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Demo format · not an official result")).toBeVisible();

  await page.goto("/mock-exams");
  await expect(page.getByText("Quick demo mock").nth(1)).toBeVisible();
});

test("terminology flashcards: reveal and grade", async ({ page }) => {
  await page.goto("/terminology");
  await expect(page.getByText("1 / 10")).toBeVisible();
  await page.getByText("Tap or press Space to reveal").click();
  await page.getByRole("button", { name: /^Good/ }).click();
  await expect(page.getByText("2 / 10")).toBeVisible();

  await page.getByRole("tab", { name: "Word list" }).click();
  await page.getByPlaceholder("Search in Russian or English…").fill("jaundice");
  await expect(page.getByText("желтуха")).toBeVisible();
});

test("progress persists across reloads in this browser", async ({ page }) => {
  await page.goto("/bookmarks");
  await expect(page.getByText(/Practise these/)).toBeVisible();
  const before = await page.locator("main a[href^='/questions/']").count();
  await page.goto("/questions/q-ped-02");
  await page.getByRole("button", { name: "Bookmark question" }).click();
  await page.goto("/bookmarks");
  await expect(page.locator("main a[href^='/questions/']")).toHaveCount(before + 1);
});
