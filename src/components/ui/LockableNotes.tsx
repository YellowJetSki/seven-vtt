/* ── Lockable Notes ────────────────────────────────────────────
 * A textarea wrapper with a lock button that obscures content.
 * Useful for DM notes visible during screen-sharing.
 * ─────────────────────────────────────────────────────────────── */

import { useState, type ReactNode } from "react";

interface LockableNotesProps {
  children: ReactNode;
  /** Optional initial lock state */
  defaultLocked?: boolean;
}

export function LockableNotes({ children, defaultLocked = false }: LockableNotesProps) {
  const [locked, setLocked] = useState(defaultLocked);

  return (
    <div className="relative">
      {/* Lock toggle button */}
      <button
        onClick={() => setLocked((o) => !o)}
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-surface-700/80 text-xs transition-colors hover:bg-surface-600"
        title={locked ? "Reveal notes" : "Hide notes"}
        aria-label={locked ? "Unlock notes" : "Lock notes"}
      >
        {locked ? "🔒" : "🔓"}
      </button>

      {/* Content */}
      <div className={`relative ${locked ? "blur-sm pointer-events-none select-none" : ""}`}>
        {children}
      </div>

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-surface-900/40">
          <p className="text-xs text-surface-500">Notes are locked · Click 🔒 to reveal</p>
        </div>
      )}
    </div>
  );
}
