import { expect, test as setup } from "@playwright/test";
import { createConfirmedUser, PASSWORD, uniqueEmail } from "./helpers";

// Signs in one fresh test student per screen size through the real login
// form and saves each session. Progress is stored per account, so separate
// students keep the laptop and phone runs from affecting each other.
for (const device of ["laptop", "phone"]) {
  setup(`sign in ${device} test student`, async ({ page }) => {
    const email = uniqueEmail(`student-${device}`);
    await createConfirmedUser(email, "Test Student");
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.context().storageState({ path: `playwright/.auth/student-${device}.json` });
  });
}
