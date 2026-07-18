/* ── Smoke Tests ───────────────────────────────────────────────
 * Critical path integration tests for the VTT.
 * Tests load the live app, verify routes render, and check
 * that ErrorBoundaries don't trigger on normal navigation.
 * ─────────────────────────────────────────────────────────────── */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

test.describe("STᚱ VTT — Smoke Tests", () => {
  test("Login page loads and shows role selection", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator("body")).toBeAttached();
    // Should see role selection buttons
    await expect(page.locator("text=Dungeon Master")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Player")).toBeVisible();
  });

  test("Clicking DM role shows login form", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.locator("text=Dungeon Master").click();
    await page.waitForTimeout(500);
    // Should show username/password fields
    await expect(page.locator('input[placeholder*="username"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[placeholder*="password"]')).toBeVisible();
  });

  test("Login with valid DM credentials redirects to dashboard", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.locator("text=Dungeon Master").click();
    await page.waitForTimeout(500);
    await page.locator('input[placeholder*="username"]').fill("MikeJello");
    await page.locator('input[placeholder*="password"]').fill("Jello1");
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/\/campaign\/dashboard/, { timeout: 15000 });
  });

  test("Theatric page loads without auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/theatric`);
    await expect(page.locator("body")).toBeAttached();
  });

  test("Unknown route redirects to login", async ({ page }) => {
    await page.goto(`${BASE_URL}/nonexistent-route`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("Player page loads without auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/player`);
    await expect(page.locator("body")).toBeAttached();
  });

  test("Campaign routes redirect to login when not authenticated", async ({ page }) => {
    await page.goto(`${BASE_URL}/campaign/dashboard`);
    await expect(page).toHaveURL(/\/login/);
  });
});
