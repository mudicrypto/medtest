import { expect, test, type Locator, type Page } from "@playwright/test";
import { admin } from "./helpers";

// The results screen after a practice session (and the shared answer review
// in mock exam results), at laptop and phone sizes.

type Key = { correct: string; explanation: string; options: Record<string, string> };

/** The answer key for a demo question, read with the local test database's admin key. */
async function keyFor(slug: string): Promise<Key> {
  const { data, error } = await admin
    .from("questions")
    .select("question_options(position, text_en), question_keys(correct, explanation_en)")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  const k = Array.isArray(data.question_keys) ? data.question_keys[0] : data.question_keys;
  return {
    correct: k.correct,
    explanation: k.explanation_en,
    options: Object.fromEntries(data.question_options.map((o: { position: string; text_en: string }) => [o.position, o.text_en])),
  };
}

const wrongOf = (k: Key) => ["A", "B", "C", "D"].find((id) => id !== k.correct)!;

/** Choose an option by its letter and check it. */
async function answer(main: Locator, letter: string) {
  await main.locator(`label:has(input[type=radio][value="${letter}"])`).click();
  await main.getByRole("button", { name: "Check answer" }).click();
  await expect(main.getByRole("heading", { name: "Explanation" })).toBeVisible();
}

const reviewItems = (page: Page) => page.getByTestId("answer-review-item");

test("results show each question with my answer, the correct answer and the explanation", async ({ page }) => {
  const [k1, k2] = await Promise.all([keyFor("q-card-01"), keyFor("q-card-02")]);
  await page.goto("/practice/session?ids=q-card-01,q-card-02");
  const main = page.getByRole("main");

  // The scripted tutor is hidden for now.
  await answer(main, k1.correct);
  await expect(main.getByRole("button", { name: "Ask the tutor" })).toHaveCount(0);
  await main.getByRole("button", { name: "Next question" }).click();
  const wrong = wrongOf(k2);
  await answer(main, wrong);
  await main.getByRole("button", { name: "Finish" }).click();

  await expect(main.getByText("Session complete")).toBeVisible();
  await expect(main.getByText("50%")).toBeVisible();
  await expect(main.getByText("1 of 2 correct")).toBeVisible();
  await expect(reviewItems(page)).toHaveCount(2);
  // Demo questions stay labelled as demo in the review.
  await expect(reviewItems(page).filter({ hasText: "DEMO — not for study" })).toHaveCount(2);

  // 1. Correct answer.
  const first = reviewItems(page).nth(0);
  await expect(first.getByText("Correct", { exact: true })).toBeVisible();
  await first.locator("summary").click();
  await expect(first).toContainText(`Your answer: ${k1.correct} — ${k1.options[k1.correct]}`);
  await expect(first).toContainText(`Correct answer: ${k1.correct} — ${k1.options[k1.correct]}`);
  await expect(first).toContainText(k1.explanation.slice(0, 60));

  // 2. Incorrect answer: both my pick and the key are shown.
  const second = reviewItems(page).nth(1);
  await expect(second.getByText("Incorrect", { exact: true })).toBeVisible();
  await second.locator("summary").click();
  await expect(second).toContainText(`Your answer: ${wrong} — ${k2.options[wrong]}`);
  await expect(second).toContainText(`Correct answer: ${k2.correct} — ${k2.options[k2.correct]}`);
  await expect(second).toContainText(k2.explanation.slice(0, 60));

  // 3. Each question can be opened again.
  await second.getByRole("link", { name: "Open question" }).click();
  await expect(page).toHaveURL(/\/questions\/q-card-02$/);
  await expect(page.getByRole("main").getByText("DEMO — not for study").first()).toBeVisible();
});

test("Retry missed starts a session with only the missed questions", async ({ page }) => {
  const [k1, k2] = await Promise.all([keyFor("q-gi-01"), keyFor("q-gi-02")]);
  await page.goto("/practice/session?ids=q-gi-01,q-gi-02");
  const main = page.getByRole("main");
  await answer(main, wrongOf(k1));
  await main.getByRole("button", { name: "Next question" }).click();
  await answer(main, k2.correct);
  await main.getByRole("button", { name: "Finish" }).click();

  await main.getByRole("link", { name: "Retry 1 missed" }).click();
  await expect(page).toHaveURL(/ids=q-gi-01$/);
  await expect(main.getByText("1 / 1")).toBeVisible();
  await answer(main, k1.correct);
  await main.getByRole("button", { name: "Finish" }).click();

  await expect(main.getByText("100%")).toBeVisible();
  await expect(main.getByText("1 of 1 correct")).toBeVisible();
  await expect(main.getByRole("link", { name: /Retry/ })).toHaveCount(0);
  await expect(main.getByRole("link", { name: "New session" })).toBeVisible();
  await expect(reviewItems(page)).toHaveCount(1);
  await expect(reviewItems(page).first().getByText("Correct", { exact: true })).toBeVisible();
});

test("mock exam results mark unanswered questions as not answered", async ({ page }) => {
  await page.goto("/mock-exams/run?b=demo-quick");
  const main = page.getByRole("main");
  await main.locator("fieldset label").first().click();
  await main.getByRole("button", { name: "Submit", exact: true }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Submit" }).click();
  await expect(main.getByText("Demo format · not an official result")).toBeVisible();

  await expect(reviewItems(page)).toHaveCount(6);
  await expect(reviewItems(page).filter({ hasText: "Not answered" })).toHaveCount(5);
  const skipped = reviewItems(page).filter({ hasText: "Not answered" }).first();
  await skipped.locator("summary").click();
  await expect(skipped).toContainText("Your answer: not answered");
  await expect(skipped).toContainText(/Correct answer: [A-D] — /);
  await expect(skipped.getByRole("link", { name: "Open question" })).toBeVisible();
});
