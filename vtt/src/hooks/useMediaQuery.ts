/* ── useMediaQuery ─────────────────────────────────────────────
 * Reusable hook for responsive breakpoint detection.
 * Used for conditionally rendering floating panels vs. modals.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    mediaQueryList.addEventListener("change", handler);
    return () => mediaQueryList.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
