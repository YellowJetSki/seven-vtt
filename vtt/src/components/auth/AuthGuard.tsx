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

  if (authState !== "authenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
