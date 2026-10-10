import { defineConfig, devices } from "@playwright/test";

// End-to-end checks: builds the app, starts it, and clicks through key flows
// in a real browser at phone and laptop sizes.
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
    { name: "laptop", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 860 } } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
});
