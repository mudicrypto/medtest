import { expect, test, type Page } from "@playwright/test";
import { admin, createConfirmedUser, PASSWORD, uniqueEmail } from "./helpers";

// Practice-engine behaviour in the real app. Each test uses its own student
// so answers and scores can't leak between tests.

async function newStudent(page: Page) {
  const email = uniqueEmail("practice");
  const id = await createConfirmedUser(email, "Practice Tester");
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  return id;
}

const option = (page: Page, text: string) => page.getByRole("main").locator("label", { hasText: text });

test("feedback and explanations appear only after submitting; retry, skip, score and restart", async ({ page }) => {
  await newStudent(page);
  await page.goto("/practice/session?ids=q-card-01,q-em-02,q-pulm-03");
  const main = page.getByRole("main");
  const score = main.getByTestId("session-score");

  // Before submitting: labelled as illustrative, nothing revealed.
  await expect(main.getByText("Illustrative demo · unreviewed")).toBeVisible();
  await expect(main.getByText("Ischaemic heart disease › Acute coronary syndrome › ECG localisation")).toBeVisible();
  const check = main.getByRole("button", { name: "Check answer" });
  await expect(check).toBeDisabled();
  await option(page, "Left anterior descending artery").click();
  await expect(main.getByRole("heading", { name: "Explanation" })).toHaveCount(0);
  await expect(main.getByText("Why not:")).toHaveCount(0);
  await expect(main.getByText("Exam pearl")).toHaveCount(0);
  await expect(score).toHaveText(/Score: 0\/0/);

  // Wrong answer → feedback, per-option explanations, pearl.
  await check.click();
  await expect(main.getByRole("status")).toHaveText("Not quite — the answer is B");
  await expect(main.getByText("Why not:")).toHaveCount(3);
  await expect(main.getByText(/LAD occlusion causes anterior ST elevation/)).toBeVisible();
  await expect(main.getByText("Exam pearl")).toBeVisible();
  await expect(main.getByText(/avoid nitrates/)).toBeVisible();
  await expect(score).toHaveText(/Score: 0\/1 · 0%/);

  // Try again → cleared, then answer correctly; the retry replaces the miss in the session score.
  await main.getByRole("button", { name: "Try again" }).click();
  await expect(main.getByRole("heading", { name: "Explanation" })).toHaveCount(0);
  await expect(score).toHaveText(/Score: 0\/0/);
  await option(page, "Right coronary artery").click();
  await check.click();
  await expect(main.getByRole("status")).toHaveText("Correct");
  await expect(score).toHaveText(/Score: 1\/1 · 100%/);

  // Next question, then skip it.
  await main.getByRole("button", { name: "Next question" }).click();
  await expect(main.getByText(/ventricular fibrillation/)).toBeVisible();
  await main.getByRole("button", { name: "Skip" }).click();
  await expect(score).toHaveText(/Score: 1\/1 · 100% · 2 unanswered/);

  // Previous goes back to the skipped question, still unanswered.
  await main.getByRole("button", { name: "Previous" }).click();
  await expect(main.getByText(/ventricular fibrillation/)).toBeVisible();
  await expect(main.getByRole("button", { name: "Check answer" })).toBeDisabled();
  await main.getByRole("button", { name: "Skip" }).click();

  // Last question: answer, then finish.
  await option(page, "High-dose nebulised salbutamol").click();
  await check.click();
  await expect(main.getByRole("status")).toHaveText("Correct");
  await main.getByRole("button", { name: "Finish" }).click();

  // The skipped question is not counted as incorrect.
  await expect(main.getByText("Session complete")).toBeVisible();
  await expect(main.getByTestId("session-accuracy")).toHaveText("100%");
  await expect(main.getByText("2 of 2 answered correctly")).toBeVisible();
  await expect(main.getByRole("definition").nth(0)).toHaveText("2");
  await expect(main.getByRole("definition").nth(1)).toHaveText("0");
  await expect(main.getByRole("definition").nth(2)).toHaveText("1");

  // Restart the whole session.
  await main.getByRole("button", { name: "Restart session" }).click();
  await expect(main.getByText(/40 minutes of crushing retrosternal chest pain/)).toBeVisible();
  await expect(main.getByRole("button", { name: "Check answer" })).toBeDisabled();
  await expect(score).toHaveText(/Score: 0\/0 · 3 unanswered/);
});

test("a double-clicked submission is recorded once", async ({ page }) => {
  const userId = await newStudent(page);
  await page.goto("/questions/q-endo-04");
  const main = page.getByRole("main");
  await option(page, "Metformin").click();
  await main.getByRole("button", { name: "Check answer" }).dblclick();
  await expect(main.getByRole("status")).toHaveText("Correct");
  await page.waitForTimeout(500);
  const { data } = await admin.from("attempts").select("id").eq("user_id", userId);
  expect(data).toHaveLength(1);
});

test("topic filtering narrows a session to the chosen topic", async ({ page }) => {
  await newStudent(page);
  await page.goto("/practice");
  const main = page.getByRole("main");
  await main.getByRole("button", { name: /Emergency medicine/ }).click();
  const topics = main.getByRole("group", { name: "Topics" });
  await expect(topics.getByRole("button")).toHaveCount(4);
  await topics.getByRole("button", { name: /Anaphylaxis/ }).click();
  await expect(main.getByText("1 of 1 available questions")).toBeVisible();
  await main.getByRole("button", { name: "Start practice" }).click();

  await expect(page).toHaveURL(/specialties=emergency-medicine&topic=Anaphylaxis/);
  await expect(main.getByText(/wasp sting/)).toBeVisible();
  await expect(main.getByText("1 / 1")).toBeVisible();
});

test("mistakes are tracked and can be retried", async ({ page }) => {
  await newStudent(page);
  await page.goto("/practice/session?ids=q-em-04,q-neuro-01");
  const main = page.getByRole("main");
  await option(page, "Atropine").click();
  await main.getByRole("button", { name: "Check answer" }).click();
  await expect(main.getByRole("status")).toHaveText("Not quite — the answer is C");
  await main.getByRole("button", { name: "Next question" }).click();
  await main.getByRole("button", { name: "Finish" }).click();
  await expect(main.getByText("0 of 1 answered correctly")).toBeVisible();

  await main.getByRole("link", { name: "Retry 1 missed" }).click();
  await expect(main.getByText(/pinpoint pupils/)).toBeVisible();
  await expect(main.getByText("1 / 1")).toBeVisible();

  await page.goto("/review/mistakes");
  await expect(main.getByText(/pinpoint pupils/)).toBeVisible();
  await expect(main.getByText("Missed 1 time")).toBeVisible();
});
