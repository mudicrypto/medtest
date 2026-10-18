import { expect, test, type Locator, type Page } from "@playwright/test";
import { admin, createConfirmedUser, PASSWORD, uniqueEmail } from "./helpers";

// The General Medicine Primary Accreditation bank (5,071 questions), used the
// way a student would. Needs the bank in the LOCAL database:
// `pnpm content:import-gm`. The package is private (not in git), so without it
// these tests are skipped with that message rather than failing.

const GM = "pa-general-medicine-5071-q%";
type Q = { slug: string; correct: string | null; options: number; flags: string[]; stem_ru: string; stem_en: string };
let total = 0;
let five: Q | undefined;
let noKey: Q | undefined;
let oneOption: Q | undefined;

async function find(filter: (q: Q) => boolean): Promise<Q | undefined> {
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("questions")
      .select("slug, stem_ru, stem_en, source_flags, question_options(position), question_keys(correct)")
      .like("slug", GM)
      .order("slug")
      .range(from, from + 999);
    if (error) throw error;
    for (const r of data) {
      const k = Array.isArray(r.question_keys) ? r.question_keys[0] : r.question_keys;
      const q = { slug: r.slug, correct: k?.correct ?? null, options: r.question_options.length, flags: r.source_flags, stem_ru: r.stem_ru ?? "", stem_en: r.stem_en };
      if (filter(q)) return q;
    }
    if (data.length < 1000) return undefined;
  }
}

test.beforeAll(async () => {
  const { count } = await admin.from("questions").select("slug", { count: "exact", head: true }).like("slug", GM);
  total = count ?? 0;
  if (!total) return;
  [five, noKey, oneOption] = await Promise.all([
    find((q) => q.options === 5 && q.correct !== null),
    find((q) => q.correct === null),
    find((q) => q.options === 1 && q.correct !== null),
  ]);
});

test.beforeEach(() => {
  test.skip(total === 0, "General Medicine bank not imported locally: run `pnpm content:import-gm`.");
});

async function signInNew(page: Page) {
  const email = uniqueEmail("gm");
  await createConfirmedUser(email, "GM Tester");
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("main").getByText("Answer a few questions")).toBeVisible();
}

async function answer(main: Locator, letter: string) {
  await main.locator(`label:has(input[type=radio][value="${letter}"])`).click();
  await main.getByRole("button", { name: "Check answer" }).click();
  await expect(main.getByRole("heading", { name: "Explanation" })).toBeVisible();
}

test("Practice lists every General Medicine question under PA › General Medicine › discipline", async ({ page }) => {
  await signInNew(page);
  const main = page.getByRole("main");
  await page.goto("/practice");

  const sections = main.locator("section[aria-label^='Primary Accreditation › General Medicine (31.05.01) › ']");
  await expect(sections).toHaveCount(19);
  await expect(main.locator("section[aria-label='Primary Accreditation › General Medicine (31.05.01) › Cardiology']")).toBeVisible();
  // Kept apart from the Cardiology specialty bank.
  await expect(main.locator("section[aria-label='Cardiology › Medications']")).toBeVisible();

  const counts = await sections.locator("button[aria-pressed]").allInnerTexts();
  const sum = counts.reduce((n, t) => n + Number(t.match(/(\d+) questions?/)?.[1] ?? 0), 0);
  expect(sum).toBe(5071);

  // A whole discipline can be practised at once.
  const cardiology = main.locator("section[aria-label='Primary Accreditation › General Medicine (31.05.01) › Cardiology']");
  await cardiology.getByRole("button", { name: "Select all" }).click();
  await expect(main.getByText("10 of 1046 available questions")).toBeVisible();
  await main.getByRole("button", { name: "Start practice" }).click();
  await expect(page).toHaveURL(/topics=pa-gm-cardiology-/);
  await expect(main.getByText("1 / 10")).toBeVisible();
  await expect(main.getByText("English: AI translation")).toBeVisible();
  await expect(main.getByText("In medical review", { exact: true })).toBeVisible();
});

test("a five-option question: all options shown, both languages, graded with its source key", async ({ page }) => {
  test.skip(!five, "No five-option question with a key.");
  await signInNew(page);
  const main = page.getByRole("main");
  await page.goto(`/questions/${five!.slug}`);
  await expect(main.locator("input[type=radio]")).toHaveCount(5);
  await expect(main.getByText(five!.stem_en, { exact: true })).toBeVisible();
  await expect(main.getByText(five!.stem_ru, { exact: true })).toBeVisible();
  // Flagged in the source: a note says the text may be imperfect.
  if (five!.flags.length) await expect(main.getByTestId("source-note")).toBeVisible();
  await answer(main, five!.correct!);
  await expect(main.getByRole("status")).toHaveText("Correct");
});

test("a one-option question is shown as in the source", async ({ page }) => {
  test.skip(!oneOption, "No one-option question.");
  await signInNew(page);
  const main = page.getByRole("main");
  await page.goto(`/questions/${oneOption!.slug}`);
  await expect(main.locator("input[type=radio]")).toHaveCount(1);
  await answer(main, "A");
  await expect(main.getByRole("status")).toHaveText(oneOption!.correct === "A" ? "Correct" : /Not quite/);
});

test("a question with no answer key is shown but never scored", async ({ page }) => {
  test.skip(!noKey, "No unscored question.");
  await signInNew(page);
  const main = page.getByRole("main");
  await page.goto(`/practice/session?ids=${noKey!.slug}`);
  await answer(main, "B");
  await expect(main.getByRole("status")).toHaveText("Not scored");
  await expect(main.getByText("The source doesn't mark a correct answer for this question, so it isn't scored.").first()).toBeVisible();
  // The pick is not shown as wrong, and no option is shown as correct.
  await expect(main.getByLabel("Correct answer")).toHaveCount(0);
  await main.getByRole("button", { name: "Finish" }).click();
  await expect(main.getByText(/0 of 0 correct · 1 not scored/)).toBeVisible();
  const item = page.getByTestId("answer-review-item");
  await expect(item.getByText("Not scored", { exact: true })).toBeVisible();

  // Nothing was recorded: no mistake, no progress.
  await page.goto("/review/mistakes");
  await expect(main.getByText("No open mistakes")).toBeVisible();
});

test("the General Medicine mock draws only from this bank and scores it", async ({ page }) => {
  await signInNew(page);
  const main = page.getByRole("main");
  await page.goto("/mock-exams");
  await expect(main.getByText("General Medicine practice mock")).toBeVisible();
  await page.goto("/mock-exams/run?b=demo-general-medicine");
  await expect(main.getByText("0 of 60 answered")).toBeVisible();
  await main.locator("fieldset label").first().click();
  await main.getByRole("button", { name: "Submit", exact: true }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Submit" }).click();
  await expect(main.getByText("Demo format · not an official result")).toBeVisible();
  await expect(main.getByText(/of 60 correct/)).toBeVisible();
  const items = page.getByTestId("answer-review-item");
  await expect(items).toHaveCount(60);
  // Every question came from the General Medicine bank.
  const links = await items.getByRole("link", { name: "Open question" }).evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(links.every((h) => h?.startsWith("/questions/pa-general-medicine-5071-q"))).toBe(true);
});
