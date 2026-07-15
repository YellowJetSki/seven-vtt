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

/**
 * Returns the env value or an empty string if not set.
 * Use this for truly optional keys that won't crash the app.
 */
function optionalEnv(key: string): string {
  return (import.meta.env[key] as string | undefined) ?? "";
}

export const ENV = {
  /* ── Required — app won't start without these ── */
  DM_USERNAME: requiredEnv("VITE_DM_USERNAME"),
  DM_PASSWORD: requiredEnv("VITE_DM_PASSWORD"),

  /* ── Optional — feature-gated external APIs ── */
  DEEPSEEK_API_KEY: optionalEnv("VITE_DEEPSEEK_API_KEY"),
  SPOTIFY_CLIENT_ID: optionalEnv("VITE_SPOTIFY_CLIENT_ID"),
  SPOTIFY_CLIENT_SECRET: optionalEnv("VITE_SPOTIFY_CLIENT_SECRET"),
} as const;
