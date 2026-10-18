import { expect, test, type Locator, type Page } from "@playwright/test";
import { admin, createConfirmedUser, PASSWORD, uniqueEmail } from "./helpers";

// A brand-new student's main study journeys: topic practice, mistakes,
// bookmarks, progress and terminology. A fresh account keeps the numbers exact.

async function signInNew(page: Page) {
  const email = uniqueEmail("study");
  await createConfirmedUser(email, "Study Tester");
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("main").getByText("Answer a few questions")).toBeVisible();
}

/** The correct option letter for a demo question (local test database only). */
async function correctFor(slug: string): Promise<string> {
  const { data, error } = await admin.from("questions").select("question_keys(correct)").eq("slug", slug).single();
  if (error) throw error;
  const k = Array.isArray(data.question_keys) ? data.question_keys[0] : data.question_keys;
  return k.correct;
}
const other = (letter: string) => (letter === "A" ? "B" : "A");

async function answer(main: Locator, letter: string) {
  await main.locator(`label:has(input[type=radio][value="${letter}"])`).click();
  await main.getByRole("button", { name: "Check answer" }).click();
  await expect(main.getByRole("heading", { name: "Explanation" })).toBeVisible();
}

test("topic practice, mistakes, bookmarks and progress", async ({ page }) => {
  const [gi1, gi2] = await Promise.all([correctFor("q-gi-01"), correctFor("q-gi-02")]);
  await signInNew(page);
  const main = page.getByRole("main");

  // 1. Practise one topic. Its two questions come unseen, in slug order.
  await page.goto("/practice");
  await main.getByRole("button", { name: /^Gastroenterology Гастроэнтерология/ }).click();
  await expect(main.getByText("2 of 2 available questions")).toBeVisible();
  await main.getByRole("button", { name: "Start practice" }).click();
  await expect(page).toHaveURL(/topics=gastroenterology/);
  await expect(main.getByText("1 / 2")).toBeVisible();
  await answer(main, other(gi1));
  await main.getByRole("button", { name: "Next question" }).click();
  await answer(main, gi2);
  await main.getByRole("button", { name: "Finish" }).click();
  await expect(main.getByText("1 of 2 correct")).toBeVisible();

  // 2. The miss is listed under Mistakes; retrying it correctly clears it.
  await page.goto("/review/mistakes");
  await expect(main.getByText("Missed 1 time")).toBeVisible();
  await main.getByRole("link", { name: "Retry all 1" }).click();
  await expect(page).toHaveURL(/mode=review&ids=q-gi-01$/);
  await answer(main, gi1);
  await main.getByRole("button", { name: "Finish" }).click();
  await expect(main.getByText("1 of 1 correct")).toBeVisible();
  await page.goto("/review/mistakes");
  await expect(main.getByText("No open mistakes")).toBeVisible();

  // 3. Bookmark a question, then practise from Bookmarks.
  await page.goto("/questions/q-gi-02");
  await main.getByRole("button", { name: "Bookmark question" }).click();
  await expect(main.getByRole("button", { name: "Remove bookmark" })).toBeVisible();
  await page.goto("/bookmarks");
  await expect(main.locator("a[href='/questions/q-gi-02']")).toBeVisible();
  await main.getByRole("link", { name: "Practise these" }).click();
  await expect(page).toHaveURL(/ids=q-gi-02$/);
  await expect(main.getByText("1 / 1")).toBeVisible();

  // 4. Progress reflects the three answers.
  await page.goto("/analytics");
  await expect(main.getByText("Questions answered").locator("..")).toHaveText("Questions answered33 this week");
  await expect(main.getByText(/^2 of \d+ questions seen$/)).toBeVisible();
  await expect(main.getByText("Gastroenterology", { exact: true }).first().locator("..")).toContainText("67%");

  // 5. The dashboard shows today's count.
  await page.goto("/dashboard");
  await expect(main.getByText("3 / 20")).toBeVisible();
});

test("terminology: both directions, a full session, and the word list", async ({ page }) => {
  await signInNew(page);
  const main = page.getByRole("main");
  await page.goto("/terminology");

  // Russian → English by default; the switch shows English first.
  await expect(main.getByText("одышка")).toBeVisible();
  await main.getByRole("button", { name: "Switch to English → Russian" }).click();
  await expect(main.getByText("shortness of breath (dyspnoea)")).toBeVisible();
  await expect(main.getByText("одышка")).toHaveCount(0);
  await main.getByRole("button", { name: "Switch to Russian → English" }).click();

  // Ten new cards per session; grading each moves on.
  for (let i = 1; i <= 10; i++) {
    await expect(main.getByText(`${i} / 10`)).toBeVisible();
    await main.getByText("Tap or press Space to reveal").click();
    await main.getByRole("button", { name: /^Good/ }).click();
  }
  await expect(main.getByText("Session complete")).toBeVisible();
  await expect(main.getByText("You studied 10 terms.", { exact: false })).toBeVisible();
  await expect(main.getByRole("link", { name: "Go to daily review" })).toBeVisible();

  // Studied terms are marked in the word list.
  await main.getByRole("tab", { name: "Word list" }).click();
  await expect(main.getByText(/^20 terms/)).toBeVisible();
  await main.getByPlaceholder("Search in Russian or English…").fill("shortness");
  await expect(main.getByText("одышка")).toBeVisible();
  await expect(main.getByText(/^Pulmonology · Next in \d+d$/)).toBeVisible();
});
