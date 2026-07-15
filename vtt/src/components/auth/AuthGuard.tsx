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
