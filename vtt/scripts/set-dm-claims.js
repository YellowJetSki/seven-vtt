/**
 * STᚱ VTT — DM Custom Claims Setup Script
 * 
 * Run this ONCE after creating the DM Firebase Auth user:
 *   node scripts/set-dm-claims.js
 * 
 * This grants the DM user the `role: "dm"` custom claim,
 * which Firestore rules check for write access.
 * 
 * Prerequisites:
 *   1. A Firebase service account key JSON file at FIREBASE_SERVICE_ACCOUNT_PATH
 *   2. A Firebase Auth user exists with the email in .env (VITE_FIREBASE_AUTH_EMAIL)
 * 
 * How to get a service account key:
 *   Firebase Console → Project Settings → Service Accounts → Generate New Private Key
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Configuration ──────────────────────────────────────────
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  || resolve(__dirname, "../firebase-service-account.json");

const DM_EMAIL = process.env.DM_AUTH_EMAIL
  || "dm@arkla.com";

const DM_ROLE = "dm"; // Matches `request.auth.token.role == "dm"` in firestore.rules

// ── Main ───────────────────────────────────────────────────
async function main() {
  // Validate service account file exists
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`❌ Service account not found at: ${SERVICE_ACCOUNT_PATH}`);
    console.error("");
    console.error("To generate one:");
    console.error("  1. Go to Firebase Console → Project Settings → Service Accounts");
    console.error("  2. Click 'Generate New Private Key'");
    console.error("  3. Save the JSON file as 'firebase-service-account.json' in the project root");
    console.error("  4. Re-run this script");
    process.exit(1);
  }

  // Initialize Firebase Admin SDK
  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  const auth = getAuth();

  try {
    // Find the user by email
    const user = await auth.getUserByEmail(DM_EMAIL);
    console.log(`✓ Found user: ${user.email} (${user.uid})`);

    // Set custom claims
    await auth.setCustomUserClaims(user.uid, { role: DM_ROLE });
    console.log(`✓ Custom claims set: role = "${DM_ROLE}"`);

    // Verify the claims
    const updatedUser = await auth.getUser(user.uid);
    console.log(`✓ Verified claims:`, JSON.stringify(updatedUser.customClaims, null, 2));

    console.log("");
    console.log("✅ DM custom claims setup complete!");
    console.log(`   Email: ${DM_EMAIL}`);
    console.log(`   Role: ${DM_ROLE}`);
    console.log("");
    console.log("Next steps:");
    console.log("  1. Deploy firestore.rules: firebase deploy --only firestore:rules");
    console.log("  2. The DM can now log in and Firestore will accept writes");
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === "auth/user-not-found") {
      console.error(`❌ No Firebase Auth user found with email: ${DM_EMAIL}`);
      console.error("");
      console.error("To create one:");
      console.error("  1. Go to Firebase Console → Authentication → Users → Add User");
      console.error("  2. Email: dm@arkla.com");
      console.error("  3. Password: (use a strong password, store in .env)");
      console.error("  4. Re-run this script");
    } else {
      console.error("❌ Error:", error.message || String(err));
    }
    process.exit(1);
  }
}

main();
