/**
 * STᚱ VTT — useResponsive
 *
 * Hook for responsive breakpoint detection.
 * Provides a single source of truth for mobile/desktop state.
 *
 * Usage:
 *   const { isMobile, isDesktop, isSidebarCollapsed } = useResponsive();
 *
 *   - isMobile:  < 1024px (lg breakpoint)
 *   - isDesktop: >= 1024px (lg and above)
 *   - On desktop, the sidebar can be collapsed (w-16) or open (w-64)
 *   - On mobile, the sidebar is always a full-width overlay
 */

import { useState, useEffect, useCallback } from "react";

const LG_BREAKPOINT = 1024;

export interface UseResponsiveResult {
  /** True when viewport < 1024px */
  isMobile: boolean;
  /** True when viewport >= 1024px */
  isDesktop: boolean;
  /** Window width in pixels */
  width: number;
  /** Window height in pixels */
  height: number;
}

export function useResponsive(): UseResponsiveResult {
  const [size, setSize] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1440,
    height: typeof window !== "undefined" ? window.innerHeight : 900,
  }));

  const handleResize = useCallback(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    // Set initial value
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  return {
    isMobile: size.width < LG_BREAKPOINT,
    isDesktop: size.width >= LG_BREAKPOINT,
    width: size.width,
    height: size.height,
  };
}
