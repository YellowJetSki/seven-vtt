// ── UI State ──────────────────────────────────────────────────

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

// ── Auth ──────────────────────────────────────────────────────

export type AuthState = "unauthenticated" | "authenticated";
export type UserRole = "dm" | "player";
