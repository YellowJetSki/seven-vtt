import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./vtt/tests",
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    headless: true,
  },
  webServer: {
    command: "npm run dev --prefix vtt",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
