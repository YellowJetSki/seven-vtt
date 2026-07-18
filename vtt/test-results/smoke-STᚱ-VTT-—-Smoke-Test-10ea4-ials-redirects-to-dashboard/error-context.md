# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> STᚱ VTT — Smoke Tests >> Login with valid DM credentials redirects to dashboard
- Location: tests\smoke.spec.ts:29:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/campaign\/dashboard/
Received string:  "http://localhost:5173/login"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    33 × unexpected value "http://localhost:5173/login"

```

```yaml
- complementary:
  - img "App Icon"
  - text: STᚱ VTT
  - navigation:
    - link "◈ Dashboard":
      - /url: /campaign/dashboard
    - link "⚔ Players":
      - /url: /campaign/player-cards
    - link "⚗ Homebrew":
      - /url: /campaign/homebrew
    - link "⚡ Encounters":
      - /url: /campaign/encounters
    - link "🗺 Battle Maps":
      - /url: /campaign/maps
    - link "📖 Journal":
      - /url: /campaign/journal
    - link "⚙ Settings":
      - /url: /campaign/settings
  - button "Connect Spotify":
    - img
    - text: Connect Spotify
  - text: 👑
  - paragraph: MikeJello
  - paragraph: Dungeon Master
  - button "⟐ Sign Out"
  - button "Collapse sidebar": ◀
- banner:
  - navigation "Breadcrumb": Arkla / Command Center
  - text: 🎲 Physical Dice Online 4 Sync DM
- main:
  - text: 🗺️
  - heading "Welcome, Dungeon Master" [level=2]
  - paragraph: Start a new campaign or import an existing one to begin your adventure.
  - button "✨ New Campaign Choose from Arkla template or create a custom campaign":
    - text: ✨
    - paragraph: New Campaign
    - paragraph: Choose from Arkla template or create a custom campaign
  - button "📥 Import Campaign Load a campaign from a JSON file":
    - text: 📥
    - paragraph: Import Campaign
    - paragraph: Load a campaign from a JSON file
  - paragraph: Your campaign data is stored locally. Use export to back it up.
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
  23 |     await page.waitForTimeout(500);
  24 |     // Should show username/password fields
  25 |     await expect(page.locator('input[placeholder*="username"]')).toBeVisible({ timeout: 10000 });
  26 |     await expect(page.locator('input[placeholder*="password"]')).toBeVisible();
  27 |   });
  28 | 
  29 |   test("Login with valid DM credentials redirects to dashboard", async ({ page }) => {
  30 |     await page.goto(`${BASE_URL}/login`);
  31 |     await page.locator("text=Dungeon Master").click();
  32 |     await page.waitForTimeout(500);
  33 |     await page.locator('input[placeholder*="username"]').fill("MikeJello");
  34 |     await page.locator('input[placeholder*="password"]').fill("Jello1");
  35 |     await page.locator('button[type="submit"]').first().click();
> 36 |     await expect(page).toHaveURL(/\/campaign\/dashboard/, { timeout: 15000 });
     |                        ^ Error: expect(page).toHaveURL(expected) failed
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