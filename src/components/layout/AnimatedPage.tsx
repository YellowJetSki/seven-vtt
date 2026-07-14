/* ── Animated Page Wrapper ─────────────────────────────────────
 * Provides a subtle fade+slide-up animation for page transitions.
 * Wraps page content to ensure smooth navigation experiences.
 * ─────────────────────────────────────────────────────────────── */

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
  /** Unique key to trigger re-animation (e.g., location.pathname) */
  pageKey?: string;
}

export function AnimatedPage({ children, className = "", pageKey }: AnimatedPageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger animation on mount and on pageKey change
    setIsVisible(false);
    const frame = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [pageKey]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-300 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-3 opacity-0"
      } ${className}`}
      role="region"
      aria-live="polite"
    >
      {children}
    </div>
  );
}
