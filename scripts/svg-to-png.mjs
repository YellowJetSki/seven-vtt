#!/usr/bin/env node
/**
 * Converts AppIcon.svg to AppIcon.png using Playwright's headless browser.
 * This script uses the chromium instance that is already installed for Playwright.
 *
 * Usage: node scripts/svg-to-png.mjs
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const svgPath = path.resolve(root, "vtt", "public", "AppIcon.svg");
const pngPath = path.resolve(root, "vtt", "public", "AppIcon.png");

async function main() {
  if (!fs.existsSync(svgPath)) {
    console.error(`✗ SVG not found at ${svgPath}`);
    process.exit(1);
  }

  console.log(`✓ Found SVG at ${svgPath}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 512, height: 512 },
  });

  // Read the SVG and convert to a data URI
  const svgContent = fs.readFileSync(svgPath, "utf8");
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString("base64")}`;

  // Set page content to just display the SVG at full size
  await page.setContent(`<!DOCTYPE html>
<html>
<body style="margin:0;background:transparent;">
  <img src="${dataUri}" width="512" height="512" style="display:block;" />
</body>
</html>`);

  // Wait for the image to render
  await page.waitForSelector("img");
  await page.waitForTimeout(500);

  // Take a screenshot at 2x for retina quality
  await page.screenshot({
    path: pngPath,
    type: "png",
    fullPage: true,
  });

  await browser.close();

  const stats = fs.statSync(pngPath);
  console.log(`✓ Generated AppIcon.png (${(stats.size / 1024).toFixed(1)} KB) at ${pngPath}`);
}

main().catch((err) => {
  console.error("✗ Failed:", err.message);
  process.exit(1);
});
