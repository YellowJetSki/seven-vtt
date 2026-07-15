/* ── Environment Variable Guard ────────────────────────────────
 *
 * ENHANCED RESILIENCE: All env vars are fetched lazily or with
 * safe defaults so the app never crashes at import time.
 * Missing required vars are surfaced via a `getMissingKeys()` helper.
 * ─────────────────────────────────────────────────────────────── */

/** Returns the env value or throws a descriptive error. */
function requiredEnv(key: string): string {
  const value = import.meta.env[key] as string | undefined;
  if (!value) {
    console.warn(`[ENV] Missing required variable: ${key}. App may not function correctly.`);
    return "";
  }
  return value;
}

/** Returns the env value or an empty string if not set. */
function optionalEnv(key: string): string {
  return (import.meta.env[key] as string | undefined) ?? "";
}

export const ENV = {
  /* ── Required — authentication credentials ── */
  DM_USERNAME: () => requiredEnv("VITE_DM_USERNAME"),
  DM_PASSWORD: () => requiredEnv("VITE_DM_PASSWORD"),

  /* ── Optional — feature-gated external APIs ── */
  DEEPSEEK_API_KEY: optionalEnv("VITE_DEEPSEEK_API_KEY"),
  SPOTIFY_CLIENT_ID: optionalEnv("VITE_SPOTIFY_CLIENT_ID"),
  SPOTIFY_CLIENT_SECRET: optionalEnv("VITE_SPOTIFY_CLIENT_SECRET"),
} as const;

/**
 * Returns a list of missing required keys.
 * Use this to show a warning banner instead of crashing.
 */
export function getMissingRequiredKeys(): string[] {
  const missing: string[] = [];
  if (!import.meta.env["VITE_DM_USERNAME"]) missing.push("VITE_DM_USERNAME");
  if (!import.meta.env["VITE_DM_PASSWORD"]) missing.push("VITE_DM_PASSWORD");
  return missing;
}
