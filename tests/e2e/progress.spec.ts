import { expect, test, type Browser, type Page } from "@playwright/test";
import { admin, createConfirmedUser, PASSWORD, uniqueEmail } from "./helpers";

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

/** A fresh browser with no shared storage — like picking up a different device. */
async function newDevice(browser: Browser, email: string) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signIn(page, email);
  return { ctx, page };
}

test("progress follows the student to another device", async ({ browser }) => {
  const email = uniqueEmail("devices");
  const userId = await createConfirmedUser(email, "Device Tester");

  // Device 1: answer one question wrong, bookmark it, turn Russian off, study a term.
  const one = await newDevice(browser, email);
  const p1 = one.page;
  await expect(p1.getByRole("main").getByText("Answer a few questions")).toBeVisible();
  await p1.goto("/questions/q-endo-03");
  const main1 = p1.getByRole("main");
  await expect(main1.locator("p[lang=ru]")).toBeVisible();
  await main1.locator("label", { hasText: "Oral fludrocortisone" }).click();
  await main1.getByRole("button", { name: "Check answer" }).click();
  await expect(main1.getByRole("status")).toContainText("Not quite");
  await main1.getByRole("button", { name: "Bookmark question" }).click();
  await expect(main1.getByRole("button", { name: "Remove bookmark" })).toBeVisible();
  await main1.getByRole("button", { name: "RU" }).click();
  await expect(main1.locator("p[lang=ru]")).toHaveCount(0);
  await p1.goto("/terminology");
  await p1.getByText("Tap or press Space to reveal").click();
  await p1.getByRole("button", { name: /^Good/ }).click();
  await expect(p1.getByText("2 / 10")).toBeVisible();
  await p1.waitForTimeout(500); // let the last saves finish
  await one.ctx.close();

  // Device 2: everything is there.
  const two = await newDevice(browser, email);
  const p2 = two.page;
  const main2 = p2.getByRole("main");
  await expect(main2.getByText("1 answers")).toBeVisible();
  await expect(main2.getByText("Endocrinology")).toBeVisible(); // weakest specialty

  await p2.goto("/review/mistakes");
  await expect(main2.getByText(/darkening skin/)).toBeVisible();
  await expect(main2.getByText("Missed 1 time")).toBeVisible();

  await p2.goto("/bookmarks");
  await expect(main2.getByText(/darkening skin/)).toBeVisible();

  await p2.goto("/analytics");
  await expect(main2.getByText(/^1 of \d+ questions seen$/)).toBeVisible();

  // The missed question is scheduled to come back ~10 minutes after the miss.
  const { data: card } = await admin
    .from("srs_cards")
    .select("item_id, lapses, reps, due, profiles!inner(id)")
    .eq("item_type", "question")
    .eq("item_id", "q-endo-03")
    .eq("user_id", userId)
    .single();
  expect(card).toMatchObject({ lapses: 1, reps: 0 });
  const minutes = (Date.parse(card!.due) - Date.now()) / 60_000;
  expect(minutes).toBeGreaterThan(5);
  expect(minutes).toBeLessThanOrEqual(10);

  // Russian preference was saved to the account.
  await p2.goto("/questions/q-endo-04");
  await expect(main2.getByRole("button", { name: "RU" })).toHaveAttribute("aria-pressed", "false");
  await expect(main2.locator("p[lang=ru]")).toHaveCount(0);

  // The studied term isn't new any more.
  await p2.goto("/terminology");
  await p2.getByRole("tab", { name: "Word list" }).click();
  await expect(main2.getByText(/Next in 1d/)).toBeVisible();
  await two.ctx.close();
});

test("a mock exam result is saved to the account", async ({ browser }) => {
  const email = uniqueEmail("mock");
  await createConfirmedUser(email, "Mock Tester");
  const one = await newDevice(browser, email);
  await one.page.goto("/mock-exams/run?b=demo-quick");
  const main = one.page.getByRole("main");
  await main.locator("fieldset label").first().click();
  await main.getByRole("button", { name: "Submit", exact: true }).first().click();
  await one.page.getByRole("dialog").getByRole("button", { name: "Submit" }).click();
  await expect(main.getByText("Demo format · not an official result")).toBeVisible();
  await one.ctx.close();

  const two = await newDevice(browser, email);
  await two.page.goto("/mock-exams");
  await expect(two.page.getByRole("main").getByText(/\/6 · \d+%/)).toBeVisible();
  await two.ctx.close();
});
