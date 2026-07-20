/**
 * STᚱ VTT — useBodyScrollLock
 *
 * Hook that prevents body scrolling when a condition is true.
 * Used for modals, sidebar overlays, and drawers on mobile.
 *
 * Automatically restores scroll on unmount and when the condition changes.
 *
 * Usage:
 *   useBodyScrollLock(isSidebarOpen && isMobile);
 */

import { useEffect } from "react";

export function useBodyScrollLock(shouldLock: boolean): void {
  useEffect(() => {
    if (shouldLock) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [shouldLock]);
}
