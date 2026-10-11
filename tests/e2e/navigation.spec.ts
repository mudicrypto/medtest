import { expect, test, type Page } from "@playwright/test";

// Every section is reachable from the navigation, at laptop and phone sizes,
// and unknown addresses get a friendly "Page not found".

const sections = [
  { label: "Dashboard", short: "Home", url: /\/dashboard$/, heading: /^Welcome back/ },
  { label: "Practice", short: "Practice", url: /\/practice$/, heading: /^Practice$/ },
  { label: "Daily review", short: "Review", url: /\/review$/, heading: /^Daily review$/ },
  { label: "Mock exams", short: null, url: /\/mock-exams$/, heading: /^Mock exams$/ },
  { label: "Terminology", short: "Terms", url: /\/terminology$/, heading: /^Terminology trainer$/ },
  { label: "Mistakes", short: null, url: /\/review\/mistakes$/, heading: /^Mistakes$/ },
  { label: "Bookmarks", short: null, url: /\/bookmarks$/, heading: /^Bookmarks$/ },
  { label: "Progress", short: "Progress", url: /\/analytics$/, heading: /^Your progress$/ },
];

const isPhone = () => test.info().project.name === "phone";

/** Opens a section the way a student would on this screen size. */
async function openSection(page: Page, s: (typeof sections)[number]) {
  if (!isPhone()) {
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: s.label, exact: true }).click();
  } else if (s.short) {
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: s.short, exact: true }).click();
  } else {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("navigation", { name: "All sections" }).getByRole("link", { name: s.label, exact: true }).click();
  }
}

test("every section opens from the navigation and is highlighted", async ({ page }) => {
  await page.goto("/dashboard");
  for (const s of sections) {
    await openSection(page, s);
    await expect(page).toHaveURL(s.url);
    await expect(page.getByRole("main").getByRole("heading", { level: 1, name: s.heading })).toBeVisible();
    const nav = isPhone() && s.short ? page.getByRole("navigation", { name: "Primary" }) : null;
    if (nav) await expect(nav.getByRole("link", { name: s.short!, exact: true })).toHaveAttribute("aria-current", "page");
    if (!isPhone()) {
      await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: s.label, exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
    // The phone menu closes after choosing a section.
    await expect(page.getByRole("navigation", { name: "All sections" })).toHaveCount(0);
  }
});

test("the logo takes a signed-in student to their dashboard", async ({ page }) => {
  await page.goto("/practice");
  await page.getByRole("link", { name: "MedPrep dashboard" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("a missing question shows a friendly page inside the app", async ({ page }) => {
  await page.goto("/questions/does-not-exist");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(main.getByText(/withdrawn for review/)).toBeVisible();
  await main.getByRole("link", { name: "Back to dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("an unknown address shows a friendly 404 page", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/");
});

test("question headers keep their buttons on the first row, even on small phones", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  const top = async (l: import("@playwright/test").Locator) => (await l.boundingBox())!.y;

  await page.goto("/questions/q-card-01");
  const main = page.getByRole("main");
  const topic = main.getByText("Cardiology", { exact: true }).first();
  const bookmark = main.getByRole("button", { name: /bookmark/i });
  await expect(bookmark).toBeVisible();
  expect(Math.abs((await top(bookmark)) - (await top(topic)))).toBeLessThan(12);

  await page.goto("/mock-exams/run?b=demo-quick");
  const flag = main.getByRole("button", { name: /^Flag/ });
  await expect(flag).toBeVisible();
  expect(Math.abs((await top(flag)) - (await top(main.getByText("Question 1", { exact: true }))))).toBeLessThan(12);
});
