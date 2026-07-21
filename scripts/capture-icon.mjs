/**
 * Captures the AppIcon SVG as a PNG file using Playwright's screenshot API.
 * Usage: node scripts/capture-icon.mjs
 */
import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const htmlPath = "file:///C:/deepseek-dnd-cli/scripts/svg-to-png.html";
  await page.goto(htmlPath, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: "C:/deepseek-dnd-cli/vtt/public/AppIcon.png",
    type: "png",
    fullPage: true,
  });
  await browser.close();
  console.log("✓ AppIcon.png generated");
})();
