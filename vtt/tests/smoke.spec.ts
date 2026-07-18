import { test, expect } from "@playwright/test";

test.describe("STᚱ VTT Smoke Tests", () => {
  test("Login page loads and shows role selection", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("STᚱ VTT")).toBeVisible();
    await expect(page.getByText("Dungeon Master")).toBeVisible();
    await expect(page.getByText("Player")).toBeVisible();
  });

  test("Clicking DM role shows login form", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Dungeon Master").click();
    await expect(page.getByText("Username")).toBeVisible();
    await expect(page.getByText("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign In as Dungeon Master/i })).toBeVisible();
  });

  test("Login with valid DM credentials redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Dungeon Master").click();
    await page.fill('input[placeholder*="username"]', "MikeJello");
    await page.fill('input[type="password"]', "Jello1");
    await page.getByRole("button", { name: /Sign In/i }).click();
    await page.waitForURL("/campaign/dashboard", { timeout: 15000 });
    await expect(page.getByText("Welcome to the Arkla Campaign")).toBeVisible();
  });

  test("Theatric page loads without auth", async ({ page }) => {
    await page.goto("/theatric");
    await expect(page.getByText("STᚱ VTT")).toBeVisible();
  });

  test("Unknown route redirects to login", async ({ page }) => {
    await page.goto("/unknown-route");
    await page.waitForURL("/login");
  });

  test("Invalid login shows error message", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Dungeon Master").click();
    await page.fill('input[placeholder*="username"]', "wrong");
    await page.fill('input[type="password"]', "wrong");
    await page.getByRole("button", { name: /Sign In/i }).click();
    await expect(page.getByText(/Invalid credentials/i)).toBeVisible();
  });

  test("Campaign routes redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/campaign/dashboard");
    await page.waitForURL("/login");
  });

  test("Player Cards page renders with correct sidebar active state", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Dungeon Master").click();
    await page.fill('input[placeholder*="username"]', "MikeJello");
    await page.fill('input[type="password"]', "Jello1");
    await page.getByRole("button", { name: /Sign In/i }).click();
    await page.waitForURL("/campaign/dashboard", { timeout: 15000 });
    await page.goto("/campaign/player-cards");
    await expect(page.getByRole("heading", { name: "Player Characters" })).toBeVisible();
    await expect(page.getByText("No Characters Yet")).toBeVisible();
  });

  test("All campaign pages load without crashing", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Dungeon Master").click();
    await page.fill('input[placeholder*="username"]', "MikeJello");
    await page.fill('input[type="password"]', "Jello1");
    await page.getByRole("button", { name: /Sign In/i }).click();
    await page.waitForURL("/campaign/dashboard", { timeout: 15000 });

    const pages = [
      { url: "/campaign/dashboard", title: "Welcome to the Arkla Campaign" },
      { url: "/campaign/player-cards", title: "Player Characters" },
      { url: "/campaign/homebrew", title: "Homebrew" },
      { url: "/campaign/encounters", title: "Encounters" },
      { url: "/campaign/maps", title: "Battle Maps" },
      { url: "/campaign/journal", title: "Journal" },
      { url: "/campaign/settings", title: "Campaign Settings" },
    ];

    for (const { url, title } of pages) {
      await page.goto(url);
      await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    }
  });
});
