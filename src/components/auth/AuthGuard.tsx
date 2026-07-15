import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore, type UserRole } from "@/stores/authStore";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

/**
 * Route guard that redirects to /login if unauthenticated.
 * Optionally checks for a specific role (dm vs player).
 */
export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const state = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const location = useLocation();

  // Still loading auth state from persistence
  if (state === "loading") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-950">
        <div className="flex flex-col items-center gap-3">
          <span className="text-3xl text-accent-400 animate-pulse">Sᚱ</span>
          <p className="text-sm text-surface-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (state !== "authenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // If a player tries to access DM routes, redirect them to their dashboard
    if (role === "player") {
      return <Navigate to="/player" replace />;
    }
    // If a DM tries to access player routes, redirect to DM dashboard
    if (role === "dm") {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
