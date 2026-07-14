/* ── Environment Variable Guard ──────────────────────────────── */

function requiredEnv(key: string): string {
  const value = import.meta.env[key] as string | undefined;
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        "Ensure your .env file contains this key.",
    );
  }
  return value;
}

export const ENV = {
  FIREBASE_API_KEY: requiredEnv("VITE_FIREBASE_API_KEY"),
  FIREBASE_AUTH_DOMAIN: requiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  FIREBASE_PROJECT_ID: requiredEnv("VITE_FIREBASE_PROJECT_ID"),
  FIREBASE_STORAGE_BUCKET: requiredEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  FIREBASE_MESSAGING_SENDER_ID: requiredEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  FIREBASE_APP_ID: requiredEnv("VITE_FIREBASE_APP_ID"),
  SPOTIFY_CLIENT_ID: requiredEnv("VITE_SPOTIFY_CLIENT_ID"),
} as const;
