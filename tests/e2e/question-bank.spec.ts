import { expect, test, type Locator, type Page } from "@playwright/test";
import { admin, createConfirmedUser, PASSWORD, uniqueEmail } from "./helpers";

// The imported Cardiology → Medications bank, used the way a student would:
// topic practice, answering, results, bookmarks, mistakes and mock exams.
// Needs the bank in the LOCAL database: `pnpm content:import cardiology`.
// The source file is private (not in git), so without it these tests are
// skipped with that message rather than failing.

type Key = { slug: string; topic: string; stem_en: string; stem_ru: string; correct: string; options: Record<string, string> };

let imported: Key[] = [];
let flaggedSlug: string | null = null;
let issueCount = 0;
let topicCounts: Record<string, number> = {};

test.beforeAll(async () => {
  const { data, error } = await admin
    .from("questions")
    .select("slug, topic, stem_en, stem_ru, review_status, question_options(position, text_en), question_keys(correct)")
    .like("slug", "cardio-medications-%")
    .eq("review_status", "approved")
    .order("slug");
  if (error) throw error;
  imported = (data ?? []).map((q) => {
    const k = Array.isArray(q.question_keys) ? q.question_keys[0] : q.question_keys;
    return {
      slug: q.slug,
      topic: q.topic,
      stem_en: q.stem_en,
      stem_ru: q.stem_ru ?? "",
      correct: k!.correct,
      options: Object.fromEntries(q.question_options.map((o) => [o.position, o.text_en])),
    };
  });
  topicCounts = imported.reduce<Record<string, number>>((m, q) => ({ ...m, [q.topic]: (m[q.topic] ?? 0) + 1 }), {});
  const issues = await admin.from("question_import_issues").select("slug").like("slug", "cardio-medications-%").order("slug");
  issueCount = issues.data?.length ?? 0;
  flaggedSlug = issues.data?.[0]?.slug ?? null;
});

test.beforeEach(() => {
  test.skip(imported.length === 0, "Cardiology bank not imported locally: run `pnpm content:import cardiology`.");
});

async function signInNew(page: Page, role: "student" | "admin" = "student") {
  const email = uniqueEmail("bank");
  const id = await createConfirmedUser(email, "Bank Tester");
  if (role === "admin") await admin.from("profiles").update({ role: "admin" }).eq("id", id);
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("main").getByText("Answer a few questions")).toBeVisible();
}

const wrong = (k: Key) => ["A", "B", "C", "D"].find((x) => x !== k.correct)!;

async function answer(main: Locator, letter: string) {
  await main.locator(`label:has(input[type=radio][value="${letter}"])`).click();
  await main.getByRole("button", { name: "Check answer" }).click();
  await expect(main.getByRole("heading", { name: "Explanation" })).toBeVisible();
}

test("both topics appear under Cardiology › Medications and start a topic session", async ({ page }) => {
  await signInNew(page);
  const main = page.getByRole("main");
  await page.goto("/practice");

  const glycosides = main.getByRole("button", { name: /Cardiac glycosides, nitrates, nitroglycerin/ });
  const statins = main.getByRole("button", { name: /Statins, diuretics, angiotensin blockers and imidazolines/ });
  for (const [tile, slug, ru] of [
    [glycosides, "cardio-medications-01", "Сердечные гликозиды, нитраты, нитроглицерин, ингибиторы АПФ, циклооксигеназы"],
    [statins, "cardio-medications-02", "Статины, диуретики, блокаторы ангиотензина, имидозалина"],
  ] as const) {
    // Listed under the "Cardiology › Medications" heading (separate from General Medicine).
    await expect(main.locator("section[aria-label='Cardiology › Medications']").getByRole("button", { name: new RegExp(slug === "cardio-medications-01" ? "^Cardiac glycosides" : "^Statins") })).toBeVisible();
    await expect(tile).toContainText(ru);
    await expect(tile).toContainText(`${topicCounts[slug]} questions`);
  }

  await glycosides.click();
  await expect(main.getByText(`10 of ${topicCounts["cardio-medications-01"]} available questions`)).toBeVisible();
  await main.getByRole("button", { name: "Start practice" }).click();
  await expect(page).toHaveURL(/topics=cardio-medications-01/);
  await expect(main.getByText("1 / 10")).toBeVisible();
  await expect(main.getByText("Adapted from official source")).toBeVisible();
  await expect(main.getByText("Medically reviewed", { exact: true })).toBeVisible();
});

test("answers, exact bilingual text, no invented explanation, and the results review", async ({ page }) => {
  const [k1, k2] = imported;
  await signInNew(page);
  const main = page.getByRole("main");
  await page.goto(`/practice/session?ids=${k1.slug},${k2.slug}`);

  // Texts appear exactly as in the source, in both languages.
  await expect(main.getByText(k1.stem_en, { exact: true })).toBeVisible();
  await expect(main.getByText(k1.stem_ru, { exact: true })).toBeVisible();
  await answer(main, k1.correct);
  await expect(main.getByRole("status")).toHaveText("Correct");
  await expect(main.getByText("No explanation has been added for this question yet.")).toBeVisible();
  await main.getByRole("button", { name: "Next question" }).click();

  const w = wrong(k2);
  await answer(main, w);
  await expect(main.getByRole("status")).toHaveText(`Not quite — the answer is ${k2.correct}`);
  await main.getByRole("button", { name: "Finish" }).click();

  await expect(main.getByText("1 of 2 correct")).toBeVisible();
  const items = page.getByTestId("answer-review-item");
  await expect(items).toHaveCount(2);
  await items.nth(1).locator("summary").click();
  await expect(items.nth(1).getByText("Incorrect", { exact: true })).toBeVisible();
  await expect(items.nth(1)).toContainText(`Your answer: ${w} — ${k2.options[w]}`);
  await expect(items.nth(1)).toContainText(`Correct answer: ${k2.correct} — ${k2.options[k2.correct]}`);
  await expect(items.nth(1)).toContainText("No explanation has been added for this question yet.");
});

test("bookmarks and mistakes work with imported questions", async ({ page }) => {
  const [k1, k2] = imported.slice(2);
  await signInNew(page);
  const main = page.getByRole("main");

  await page.goto(`/questions/${k1.slug}`);
  await main.getByRole("button", { name: "Bookmark question" }).click();
  await expect(main.getByRole("button", { name: "Remove bookmark" })).toBeVisible();
  await page.goto("/bookmarks");
  await expect(main.locator(`a[href='/questions/${k1.slug}']`)).toBeVisible();

  await page.goto(`/practice/session?ids=${k2.slug}`);
  await answer(main, wrong(k2));
  await main.getByRole("button", { name: "Finish" }).click();
  await page.goto("/review/mistakes");
  await expect(main.locator(`a[href='/questions/${k2.slug}']`)).toBeVisible();
  await main.getByRole("link", { name: "Retry all 1" }).click();
  await answer(main, k2.correct);
  await main.getByRole("button", { name: "Finish" }).click();
  await page.goto("/review/mistakes");
  await expect(main.getByText("No open mistakes")).toBeVisible();
});

test("mock exams draw imported questions and review them", async ({ page }) => {
  await signInNew(page);
  const main = page.getByRole("main");
  await page.goto("/mock-exams/run?b=demo-full");
  await expect(main.getByText("0 of 18 answered")).toBeVisible();
  await main.getByRole("button", { name: "Submit", exact: true }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Submit" }).click();
  await expect(main.getByText("Demo format · not an official result")).toBeVisible();

  const items = page.getByTestId("answer-review-item");
  await expect(items).toHaveCount(18);
  // 18 random picks from ~200 questions: imported ones (no explanation) are all but certain to appear.
  const fromBank = items.filter({ hasText: "No explanation has been added for this question yet." });
  expect(await fromBank.count()).toBeGreaterThan(0);
  await fromBank.first().locator("summary").click();
  await expect(fromBank.first()).toContainText(/Correct answer: [A-D] — /);
});

test("records that need correction are hidden from students and listed for admins", async ({ page, browser }) => {
  test.skip(!flaggedSlug, "No records need correction.");
  await signInNew(page);
  await page.goto(`/questions/${flaggedSlug}`);
  await expect(page.getByRole("main").getByRole("heading", { name: "Page not found" })).toBeVisible();

  const ctx = await browser.newContext();
  const adminPage = await ctx.newPage();
  await signInNew(adminPage, "admin");
  await adminPage.goto("/admin");
  const adminMain = adminPage.getByRole("main");
  await expect(adminMain.getByRole("heading", { name: `Needs correction (${issueCount})` })).toBeVisible();
  await expect(adminMain.getByText(flaggedSlug!, { exact: true })).toBeVisible();
  await ctx.close();
});
