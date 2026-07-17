import { type ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore, type UserRole } from "@/stores/authStore";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

/**
 * Route guard that redirects to /login if unauthenticated.
 * Handles Zustand persist async rehydration by waiting for
 * the store to finish hydrating before making a decision.
 */
export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const state = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const location = useLocation();
  const [hydrated, setHydrated] = useState(false);

  // Zustand persist middleware calls set() asynchronously on mount.
  // We wait one tick to let the persisted state hydrate.
  useEffect(() => {
    const timeout = setTimeout(() => setHydrated(true), 50);
    return () => clearTimeout(timeout);
  }, []);

  if (!hydrated) {
    // Show a loading spinner while rehydrating from localStorage
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-950">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
          <span className="text-sm text-surface-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (state !== "authenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    if (role === "player") {
      return <Navigate to="/player" replace />;
    }
    if (role === "dm") {
      return <Navigate to="/campaign/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
