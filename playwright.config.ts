import { defineConfig, devices } from "@playwright/test";

// End-to-end checks against the built app and the LOCAL Supabase stack
// (`pnpm db:start`, then `pnpm build`). A setup step signs in a test student;
// the main suites then run signed in at laptop and phone sizes.

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  reporter: "list",
  use: { baseURL: "http://localhost:3100" },
  webServer: {
    command: "pnpm start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "laptop",
      testIgnore: /(auth\.setup|auth\.spec|admin\.spec|bundle\.spec|progress\.spec|practice\.spec)\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 860 }, storageState: "playwright/.auth/student-laptop.json" },
    },
    {
      name: "phone",
      testIgnore: /(auth\.setup|auth\.spec|admin\.spec|bundle\.spec|progress\.spec|practice\.spec)\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Pixel 7"], storageState: "playwright/.auth/student-phone.json" },
    },
    // Account flows start signed out.
    { name: "auth", testMatch: /(auth|admin|bundle|progress|practice)\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
  ],
});
