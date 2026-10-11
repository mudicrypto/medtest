import { execSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { createConfirmedUser, local, PASSWORD, uniqueEmail } from "./helpers";

// What students see when the database can't be reached, and that "Try again"
// recovers once it's back. Each test switches off the LOCAL stack's database
// API (the supabase_rest_medprep container), so this file runs on its own,
// after every other suite (see playwright.config.ts).

const REST = "supabase_rest_medprep";

test.describe.configure({ mode: "serial" });

function docker(cmd: "stop" | "start" | "pause" | "unpause") {
  execSync(`docker ${cmd} ${REST}`, { stdio: "ignore" });
}

/** Database API down: requests fail straight away. */
function stopDatabase() {
  docker("stop");
}

/** Database API back, and answering requests again. */
async function startDatabase() {
  const state = execSync(`docker inspect -f "{{.State.Status}}" ${REST}`, { encoding: "utf8" }).trim();
  if (state === "paused") docker("unpause");
  else if (state !== "running") docker("start");
  await expect
    .poll(
      async () => {
        const res = await fetch(`${local.API_URL}/rest/v1/topics?select=slug&limit=1`, {
          headers: { apikey: local.SECRET_KEY, Authorization: `Bearer ${local.SECRET_KEY}` },
        }).catch(() => null);
        return res?.status;
      },
      { timeout: 30_000 },
    )
    .toBe(200);
}

let email: string;

test.beforeAll(async () => {
  email = uniqueEmail("outage");
  await createConfirmedUser(email, "Outage Tester");
});

// Never leave the database switched off, even if a test fails.
test.afterEach(startDatabase);

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  // Wait for saved progress to load, so the tests start from a working app.
  await expect(page.getByRole("main").getByText("Answer a few questions")).toBeVisible();
}

const main = (page: Page) => page.getByRole("main");
/** The "Something went wrong" page (src/app/(app)/error.tsx). */
const errorPage = (page: Page) => main(page).getByRole("alert").filter({ hasText: "Something went wrong" });

test("genuinely empty screens still say so (no false errors)", async ({ page }) => {
  await signIn(page);
  await page.goto("/review");
  await expect(main(page).getByText("Nothing due right now")).toBeVisible();
  await page.goto("/bookmarks");
  await expect(main(page).getByText("No bookmarks yet")).toBeVisible();
  await expect(main(page).getByRole("alert")).toHaveCount(0);
});

test("Practice shows an error, not an empty list, and Try again recovers", async ({ page }) => {
  await signIn(page);
  stopDatabase();
  await page.goto("/practice");
  await expect(main(page).getByRole("heading", { name: "Something went wrong" })).toBeVisible({ timeout: 20_000 });
  await expect(errorPage(page).getByRole("link", { name: "Back to dashboard" })).toBeVisible();
  // Never presented as "there are no questions".
  await expect(main(page).getByText(/available questions/)).toHaveCount(0);

  // Pressing Try again while still down keeps the error on screen.
  await errorPage(page).getByRole("button", { name: "Try again" }).click();
  await expect(main(page).getByRole("heading", { name: "Something went wrong" })).toBeVisible({ timeout: 20_000 });

  await startDatabase();
  await errorPage(page).getByRole("button", { name: "Try again" }).click();
  await expect(main(page).getByRole("button", { name: /Cardiology/ })).toBeVisible();
  await expect(main(page).getByText(/of [1-9]\d* available questions/)).toBeVisible();
  await expect(main(page).getByRole("heading", { name: "Something went wrong" })).toHaveCount(0);
});

test("starting a practice session during an outage offers Try again", async ({ page }) => {
  await signIn(page);
  await page.goto("/practice");
  await expect(main(page).getByRole("button", { name: /Cardiology/ })).toBeVisible();

  stopDatabase();
  await main(page).getByRole("button", { name: "Start practice" }).click();
  await expect(page).toHaveURL(/practice\/session/);
  await expect(main(page).getByText("We couldn't load the questions")).toBeVisible({ timeout: 20_000 });
  await expect(main(page).getByText("No questions match this selection")).toHaveCount(0);

  await startDatabase();
  await main(page).getByRole("alert").filter({ hasText: "We couldn't load the questions" }).getByRole("button", { name: "Try again" }).click();
  await expect(main(page).getByRole("button", { name: "Check answer" })).toBeVisible();
});

test("saved questions show an error during an outage, then load on Try again", async ({ page }) => {
  await signIn(page);
  await page.goto("/questions/q-card-01");
  await main(page).getByRole("button", { name: "Bookmark question" }).click();
  await expect(main(page).getByRole("button", { name: "Remove bookmark" })).toBeVisible();

  stopDatabase();
  // In-app navigation keeps the already-loaded progress, so only the question
  // text request hits the database.
  await page.getByRole("link", { name: "Bookmarks" }).first().click();
  await expect(page).toHaveURL(/\/bookmarks/);
  await expect(main(page).getByText("We couldn't load the questions")).toBeVisible({ timeout: 20_000 });

  await startDatabase();
  await main(page).getByRole("alert").filter({ hasText: "We couldn't load the questions" }).getByRole("button", { name: "Try again" }).click();
  await expect(main(page).locator("a[href='/questions/q-card-01']")).toBeVisible();
});

test("a hung database gives up within seconds instead of leaving students waiting", async ({ page }) => {
  test.setTimeout(90_000);
  await signIn(page);
  // Paused: requests are accepted but never answered (the slow kind of outage).
  docker("pause");
  const started = Date.now();
  await page.goto("/practice", { waitUntil: "commit" });
  await expect(main(page).getByRole("heading", { name: "Something went wrong" })).toBeVisible({ timeout: 40_000 });
  const seconds = (Date.now() - started) / 1000;
  // Requests time out after 10 s (src/lib/supabase/server.ts); without that,
  // this page waited a minute or more.
  expect(seconds).toBeLessThan(25);

  await startDatabase();
  await errorPage(page).getByRole("button", { name: "Try again" }).click();
  await expect(main(page).getByRole("button", { name: /Cardiology/ })).toBeVisible();
});
