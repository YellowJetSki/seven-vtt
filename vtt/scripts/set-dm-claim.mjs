/**
 * One-shot script to set the DM custom claim on a Firebase Auth user.
 *
 * Usage:
 *   1. Download your Firebase service account key:
 *      Firebase Console > Project Settings > Service Accounts >
 *      "Generate new private key" → save as service-account.json
 *   2. Place service-account.json in the project root (DO NOT COMMIT).
 *   3. Run: node scripts/set-dm-claim.mjs
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = join(__dirname, "..", "service-account.json");

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
} catch {
  console.error(
    "❌ service-account.json not found at", serviceAccountPath, "\n" +
    "Download it from Firebase Console > Project Settings > Service Accounts > Generate new private key"
  );
  process.exit(1);
}

const app = initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);

const UID = "qIzvZIlf2AYUfGxfVL22tImwcII3";

try {
  await auth.setCustomUserClaims(UID, { role: "dm" });
  console.log(`✅ Custom claim { role: "dm" } set on user ${UID}`);

  // Verify
  const user = await auth.getUser(UID);
  console.log(`📋 Verified: ${user.email} → claims:`, JSON.stringify(user.customClaims, null, 2));
} catch (err) {
  console.error("❌ Failed to set custom claim:", err);
  process.exit(1);
}

process.exit(0);
