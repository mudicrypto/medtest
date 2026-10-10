import { expect, test, type Page } from "@playwright/test";
import { admin, createConfirmedUser, PASSWORD, uniqueEmail } from "./helpers";
import { toCsv, type CsvRecord } from "../../src/lib/content/csv";

async function signInAs(page: Page, role: "admin" | "student") {
  const email = uniqueEmail(role);
  const id = await createConfirmedUser(email, role === "admin" ? "Admin Tester" : "Student Tester");
  if (role === "admin") await admin.from("profiles").update({ role: "admin" }).eq("id", id);
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

const base = (slug: string): Partial<CsvRecord> => ({
  slug,
  specialty: "neurology",
  subject: "Cranial nerves",
  topic: "Trigeminal nerve",
  stem_en: "Which cranial nerve is tested by the corneal reflex (afferent limb)?",
  stem_ru: "Какой черепной нерв обеспечивает афферентное звено роговичного рефлекса?",
  option_a_en: "Facial nerve",
  option_b_en: "Trigeminal nerve",
  option_c_en: "Oculomotor nerve",
  option_d_en: "Abducens nerve",
  correct: "B",
  explanation_en: "The ophthalmic division of the trigeminal nerve carries the afferent limb; the facial nerve the efferent.",
  key_terms: "роговичный рефлекс = corneal reflex",
  origin: "original_practice",
  rights_status: "owned",
  review_status: "in_review",
});

function csvFile(rows: Partial<CsvRecord>[]) {
  return { name: "questions.csv", mimeType: "text/csv", buffer: Buffer.from(toCsv(rows), "utf8") };
}

test("students can't open the admin area", async ({ page }) => {
  await signInAs(page, "student");
  // The page streams, so the HTTP status is already sent; what matters is that
  // nothing from the admin area is rendered.
  await page.goto("/admin");
  await expect(page.getByText("This page could not be found.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Admin" })).toHaveCount(0);
  await expect(page.getByText("Content admin")).toHaveCount(0);
  const template = await page.request.get("/admin/template.csv");
  expect(template.status()).toBe(404);
});

test("admin: check a CSV, fix errors, import, approve, and the question reaches students", async ({ page, browser }) => {
  const slug = `e2e-${Date.now()}`;
  await signInAs(page, "admin");
  await page.getByRole("link", { name: "Content admin" }).first().click();
  await expect(page.getByRole("heading", { name: "Question bank" })).toBeVisible();

  // 1. A file with a broken row is reported, and can't be imported.
  await page.goto("/admin/import");
  await expect(page.getByLabel("CSV file")).toBeEnabled();
  await page.getByLabel("CSV file").setInputFiles(csvFile([base(slug), { ...base(`${slug}-b`), correct: "E", specialty: "astrology" }]));
  await page.getByRole("button", { name: "Check file" }).click();
  await expect(page.getByText("1 row needs fixing")).toBeVisible();
  await expect(page.getByText("correct must be A, B, C or D")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Import/ })).toHaveCount(0);

  // 2. A clean file previews, then imports.
  await page.getByLabel("CSV file").setInputFiles(csvFile([base(slug)]));
  await page.getByRole("button", { name: "Check file" }).click();
  await expect(page.getByText("No problems found.")).toBeVisible();
  await page.getByRole("button", { name: "Import 1 question" }).click();
  await expect(page.getByText("Import complete: 1 created, 0 updated.")).toBeVisible();

  // 3. It's hidden from students until approved.
  await page.goto(`/admin/questions/${slug}`);
  const main = page.getByRole("main");
  await expect(main.getByText("Hidden from students")).toBeVisible();
  await expect(main.getByText("Trigeminal nerve", { exact: true })).toBeVisible();
  await main.getByLabel("Approve").check();
  await main.getByPlaceholder(/Checked against/).fill("Reviewed in e2e test");
  await main.getByRole("button", { name: "Save status" }).click();
  await expect(main.getByText("Status updated.")).toBeVisible();
  await expect(main.getByText("Visible to students")).toBeVisible();
  await expect(main.getByText("Reviewed in e2e test")).toBeVisible();

  // 4. A student can now practise it, graded on the server.
  const ctx = await browser.newContext();
  const student = await ctx.newPage();
  await signInAs(student, "student");
  await student.goto(`/questions/${slug}`);
  const sMain = student.getByRole("main");
  await expect(sMain.getByText("MedPrep original practice")).toBeVisible();
  await sMain.locator("label", { hasText: "Trigeminal nerve" }).click();
  await sMain.getByRole("button", { name: "Check answer" }).click();
  await expect(sMain.getByRole("status")).toHaveText("Correct");
  await expect(sMain.getByText(/ophthalmic division/)).toBeVisible();
  await ctx.close();
});

test("admin: register a content source", async ({ page }) => {
  await signInAs(page, "admin");
  await page.goto("/admin/sources");
  const title = `Sechenov question bank ${Date.now()}`;
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Granted by").fill("Dept. of Internal Medicine");
  await page.getByLabel("Permission evidence").fill("Signed letter, ref. 123, stored in shared drive");
  await page.getByRole("button", { name: "Save source" }).click();
  await expect(page.getByText("Source saved.")).toBeVisible();
  const card = page.locator(".rounded-2xl", { has: page.getByRole("heading", { name: title }) });
  await expect(card.getByText("Signed letter, ref. 123")).toBeVisible();
  await expect(card.getByText("Dept. of Internal Medicine")).toBeVisible();
});
