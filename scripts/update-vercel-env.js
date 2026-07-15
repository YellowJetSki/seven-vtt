/* ── Update Vercel Environment Variables ────────────────────────
 * Run: node scripts/update-vercel-env.js
 * 
 * This script updates the VITE_DM_USERNAME and VITE_DM_PASSWORD
 * env vars in the Vercel project to match our local .env file.
 * ─────────────────────────────────────────────────────────────── */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", "vtt", ".env");

// Read .env file
const envContent = readFileSync(envPath, "utf-8");
const envLines = envContent.split("\n");

let dmUsername = "";
let dmPassword = "";

for (const line of envLines) {
  const trimmed = line.trim();
  if (trimmed.startsWith("VITE_DM_USERNAME=")) {
    dmUsername = trimmed.split("=")[1].replace(/"/g, "").trim();
  }
  if (trimmed.startsWith("VITE_DM_PASSWORD=")) {
    dmPassword = trimmed.split("=")[1].replace(/"/g, "").trim();
  }
}

if (!dmUsername || !dmPassword) {
  console.error("❌ Could not find VITE_DM_USERNAME or VITE_DM_PASSWORD in .env");
  process.exit(1);
}

console.log(`📝 Updating Vercel env vars:`);
console.log(`   VITE_DM_USERNAME = ${dmUsername}`);
console.log(`   VITE_DM_PASSWORD = ${dmPassword}`);

try {
  // Remove existing env vars first
  console.log("🗑️  Removing old VITE_DM_USERNAME...");
  execSync(`npx vercel env rm VITE_DM_USERNAME production --yes`, {
    stdio: "inherit",
    cwd: resolve(__dirname, ".."),
  });

  console.log("🗑️  Removing old VITE_DM_PASSWORD...");
  execSync(`npx vercel env rm VITE_DM_PASSWORD production --yes`, {
    stdio: "inherit",
    cwd: resolve(__dirname, ".."),
  });

  // Add new env vars
  console.log("➕ Adding VITE_DM_USERNAME...");
  execSync(`echo "${dmUsername}" | npx vercel env add VITE_DM_USERNAME production`, {
    stdio: "inherit",
    cwd: resolve(__dirname, ".."),
  });

  console.log("➕ Adding VITE_DM_PASSWORD...");
  execSync(`echo "${dmPassword}" | npx vercel env add VITE_DM_PASSWORD production`, {
    stdio: "inherit",
    cwd: resolve(__dirname, ".."),
  });

  console.log("✅ Vercel env vars updated successfully!");
} catch (err) {
  console.error("❌ Failed to update Vercel env vars:", err.message);
  process.exit(1);
}
