// ── UI State ──────────────────────────────────────────────────

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
  /** Optional undo callback */
  onUndo?: () => void;
  /** Custom undo label (default: "Undo") */
  undoLabel?: string;
}

// ── Auth ──────────────────────────────────────────────────────

export type AuthState = "unauthenticated" | "authenticated";
export type UserRole = "dm" | "player";
