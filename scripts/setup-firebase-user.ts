/* ── Firebase DM User Setup Script ─────────────────────────────
 *
 * Run this script once to create the DM user in Firebase Auth.
 * It uses the Admin SDK to create a user with the correct email
 * pattern: dm_<username>@strvtt.local
 *
 * ── Usage ─────────────────────────────────────────────────────
 *   1. Set GOOGLE_APPLICATION_CREDENTIALS to your service account key
 *   2. npx tsx scripts/setup-firebase-user.ts
 *
 * ── Alternative (Firebase Console) ───────────────────────────
 * You can also create the user manually:
 *   1. Go to Firebase Console → Authentication → Users
 *   2. Click "Add User"
 *   3. Email: dm_mikejello@strvtt.local
 *   4. Password: <your_dm_password>
 *   5. Click "Add User"
 * ─────────────────────────────────────────────────────────────── */

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Load service account from environment or file
const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || "str-vtt",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

async function main() {
  const username = process.env.VITE_DM_USERNAME || "MikeJello";
  const password = process.env.VITE_DM_PASSWORD || "Jello";

  if (!password || password.length < 6) {
    console.error("Password must be at least 6 characters long.");
    process.exit(1);
  }

  const email = `dm_${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@strvtt.local`;

  try {
    const app = initializeApp({ credential: cert(serviceAccount) });
    const auth = getAuth(app);

    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      console.log(`User already exists: ${existingUser.email} (${existingUser.uid})`);

      // Update password to ensure it matches .env
      await auth.updateUser(existingUser.uid, { password });
      console.log("Password updated to match current .env value.");
    } catch {
      // User doesn't exist — create them
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: `DM ${username}`,
      });
      console.log(`Created Firebase Auth user: ${userRecord.email} (${userRecord.uid})`);
    }

    console.log("\n✅ DM user is ready.");
    console.log(`   Login username: ${username} (entered in the login form)`);
    console.log(`   Firebase email: ${email}`);
    console.log("\nThe app will automatically map the username to this email on login.");
  } catch (err) {
    console.error("Failed to set up Firebase user:", err);
    process.exit(1);
  }
}

main();
