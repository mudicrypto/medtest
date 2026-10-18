import { expect, test, type Locator, type Page } from "@playwright/test";
import { admin, createConfirmedUser, PASSWORD, uniqueEmail } from "./helpers";

// The Cardiovascular pathology blocks of the Cardiology specialty bank
// (arterial hypertension; atherosclerosis and dyslipidemias). Needs them in the
// LOCAL database: `pnpm content:import-cardio-blocks`. The source files are
// private (not in git), so without them these tests are skipped.

const PREFIXES = ["cardio-arterial-hypertension-01-", "cardio-atherosclerosis-01-"];
type Q = { slug: string; topic: string; stem_en: string; stem_ru: string; correct: string | null; options: string[] };
let all: Q[] = [];

test.beforeAll(async () => {
  const { data, error } = await admin
    .from("questions")
    .select("slug, topic, stem_en, stem_ru, question_options(position, text_en), question_keys(correct)")
    .or(PREFIXES.map((p) => `slug.like.${p}%`).join(","))
    .order("slug");
  if (error) throw error;
  all = (data ?? []).map((q) => {
    const k = Array.isArray(q.question_keys) ? q.question_keys[0] : q.question_keys;
    return {
      slug: q.slug,
      topic: q.topic,
      stem_en: q.stem_en,
      stem_ru: q.stem_ru ?? "",
      correct: k?.correct ?? null,
      options: [...q.question_options].sort((a, b) => a.position.localeCompare(b.position)).map((o) => o.text_en),
    };
  });
});

test.beforeEach(() => {
  test.skip(all.length === 0, "Cardiovascular pathology blocks not imported locally: run `pnpm content:import-cardio-blocks`.");
});

async function signInNew(page: Page) {
  const email = uniqueEmail("cvpath");
  await createConfirmedUser(email, "Pathology Tester");
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

test("both topics are listed under Cardiology › Cardiovascular pathology with all their questions", async ({ page }) => {
  await signInNew(page);
  const main = page.getByRole("main");
  await page.goto("/practice");
  const section = main.locator("section[aria-label='Cardiology › Cardiovascular pathology']");
  const count = (topic: string) => all.filter((q) => q.topic === topic).length;
  await expect(section.getByRole("button", { name: /^Blood pressure pathology: arterial hypertension/ })).toContainText(
    `${count("cardio-arterial-hypertension-01")} questions`,
  );
  await expect(section.getByRole("button", { name: /^Atherosclerosis and dyslipidemias/ })).toContainText(
    `${count("cardio-atherosclerosis-01")} questions`,
  );
  await expect(section.getByText("Патология АД — артериальная гипертензия")).toBeVisible();
  // Medications stays its own group.
  await expect(main.locator("section[aria-label='Cardiology › Medications']")).toBeVisible();

  await section.getByRole("button", { name: "Select all" }).click();
  await expect(main.getByText(`10 of ${all.length} available questions`)).toBeVisible();
  await main.getByRole("button", { name: "Start practice" }).click();
  await expect(main.getByText("1 / 10")).toBeVisible();
});

test("questions are bilingual and graded with the marked answer; results, bookmarks and mistakes work", async ({ page }) => {
  const [right, wrong] = all.filter((q) => q.correct && q.options.length >= 2 && q.topic === "cardio-atherosclerosis-01");
  await signInNew(page);
  const main = page.getByRole("main");
  await page.goto(`/practice/session?ids=${right.slug},${wrong.slug}`);
  await expect(main.getByText(right.stem_en, { exact: true })).toBeVisible();
  await expect(main.getByText(right.stem_ru, { exact: true })).toBeVisible();
  await answer(main, right.correct!);
  await expect(main.getByRole("status")).toHaveText("Correct");
  await main.getByRole("button", { name: "Bookmark question" }).click();
  await main.getByRole("button", { name: "Next question" }).click();
  const pick = wrong.correct === "A" ? "B" : "A";
  await answer(main, pick);
  await expect(main.getByRole("status")).toHaveText(`Not quite — the answer is ${wrong.correct}`);
  await main.getByRole("button", { name: "Finish" }).click();
  await expect(main.getByText("1 of 2 correct")).toBeVisible();

  await page.goto("/bookmarks");
  await expect(main.locator(`a[href='/questions/${right.slug}']`)).toBeVisible();
  await page.goto("/review/mistakes");
  await expect(main.locator(`a[href='/questions/${wrong.slug}']`)).toBeVisible();
});

test("the question with no marked answer is shown but not scored", async ({ page }) => {
  const unscored = all.find((q) => q.correct === null);
  test.skip(!unscored, "No unscored question.");
  await signInNew(page);
  const main = page.getByRole("main");
  await page.goto(`/questions/${unscored!.slug}`);
  await expect(main.getByTestId("source-note")).toBeVisible();
  await answer(main, "A");
  await expect(main.getByRole("status")).toHaveText("Not scored");
});
