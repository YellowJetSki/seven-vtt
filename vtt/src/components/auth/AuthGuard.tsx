/**
 * STᚱ VTT — AuthGuard (Sprint 7: Player Re-Login Support)
 *
 * Protects routes that require authentication.
 * Handles:
 *   - Standard rehydration delay (Zustand persist)
 *   - DM role enforcement
 *   - Player role enforcement (routes to player login)
 *   - Player re-login from persisted state after page refresh
 */

import { type ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: "dm" | "player";
}

export default function AuthGuard({
  children,
  requiredRole,
}: AuthGuardProps) {
  const authState = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const characterId = useAuthStore((s) => s.characterId);
  const location = useLocation();
  const [isRehydrated, setIsRehydrated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsRehydrated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!isRehydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-950">
        <LoadingSpinner size="lg" label="Loading..." />
      </div>
    );
  }

  // Not authenticated at all
  if (authState !== "authenticated") {
    // Players who have persisted state but Firestore hasn't reconnected yet
    // should still be allowed — they might be in a character-not-found state
    // The PlayerSheetPage handles the "character not found" case gracefully
    if (requiredRole === "player" && role === "player" && characterId) {
      // Allow through — the PlayerSheetPage will check if the character exists
      // and show the "Character Not Found" message if needed
      return <>{children}</>;
    }

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but wrong role
  if (requiredRole && role !== requiredRole) {
    const redirectPath = requiredRole === "player" ? "/player" : "/login";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
