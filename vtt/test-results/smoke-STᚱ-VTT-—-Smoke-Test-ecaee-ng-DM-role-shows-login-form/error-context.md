# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> STᚱ VTT — Smoke Tests >> Clicking DM role shows login form
- Location: tests\smoke.spec.ts:20:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[type="text"]').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('input[type="text"]').first()

```

```yaml
- img "App Icon"
- heading "STᚱ VTT" [level=1]
- paragraph: Virtual Tabletop · Sign In
- button "← Back"
- paragraph: DM Sign In
- text: Username
- textbox "Enter your DM username"
- text: Password
- textbox "Enter your password"
- button "Sign In" [disabled]
- paragraph: STᚱ VTT · Virtual Tabletop
```

# Test source

```ts
  1  | /* ── Smoke Tests ───────────────────────────────────────────────
  2  |  * Critical path integration tests for the VTT.
  3  |  * Tests load the live app, verify routes render, and check
  4  |  * that ErrorBoundaries don't trigger on normal navigation.
  5  |  * ─────────────────────────────────────────────────────────────── */
  6  | 
  7  | import { test, expect } from "@playwright/test";
  8  | 
  9  | const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
  10 | 
  11 | test.describe("STᚱ VTT — Smoke Tests", () => {
  12 |   test("Login page loads and shows role selection", async ({ page }) => {
  13 |     await page.goto(`${BASE_URL}/login`);
  14 |     await expect(page.locator("body")).toBeAttached();
  15 |     // Should see role selection buttons
  16 |     await expect(page.locator("text=Dungeon Master")).toBeVisible({ timeout: 10000 });
  17 |     await expect(page.locator("text=Player")).toBeVisible();
  18 |   });
  19 | 
  20 |   test("Clicking DM role shows login form", async ({ page }) => {
  21 |     await page.goto(`${BASE_URL}/login`);
  22 |     await page.locator("text=Dungeon Master").click();
  23 |     // Should show username/password fields
> 24 |     await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 5000 });
     |                                                              ^ Error: expect(locator).toBeVisible() failed
  25 |     await expect(page.locator('input[type="password"]').first()).toBeVisible();
  26 |   });
  27 | 
  28 |   test("Login with valid DM credentials redirects to dashboard", async ({ page }) => {
  29 |     await page.goto(`${BASE_URL}/login`);
  30 |     await page.locator("text=Dungeon Master").click();
  31 |     const usernameInput = page.locator('input[type="text"]').first();
  32 |     const passwordInput = page.locator('input[type="password"]').first();
  33 |     await usernameInput.fill("MikeJello");
  34 |     await passwordInput.fill("Jello1");
  35 |     await page.locator('button[type="submit"]').first().click();
  36 |     await expect(page).toHaveURL(/\/campaign\/dashboard/, { timeout: 10000 });
  37 |   });
  38 | 
  39 |   test("Theatric page loads without auth", async ({ page }) => {
  40 |     await page.goto(`${BASE_URL}/theatric`);
  41 |     await expect(page.locator("body")).toBeAttached();
  42 |   });
  43 | 
  44 |   test("Unknown route redirects to login", async ({ page }) => {
  45 |     await page.goto(`${BASE_URL}/nonexistent-route`);
  46 |     await expect(page).toHaveURL(/\/login/);
  47 |   });
  48 | 
  49 |   test("Player page loads without auth", async ({ page }) => {
  50 |     await page.goto(`${BASE_URL}/player`);
  51 |     await expect(page.locator("body")).toBeAttached();
  52 |   });
  53 | 
  54 |   test("Campaign routes redirect to login when not authenticated", async ({ page }) => {
  55 |     await page.goto(`${BASE_URL}/campaign/dashboard`);
  56 |     await expect(page).toHaveURL(/\/login/);
  57 |   });
  58 | });
  59 | 
```