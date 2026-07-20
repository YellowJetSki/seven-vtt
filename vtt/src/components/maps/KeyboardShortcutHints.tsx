/**
 * STᚱ VTT — Keyboard Shortcut Hints Overlay (Premium)
 *
 * A floating help overlay showing all active keyboard shortcuts.
 * Activated by pressing "?" on the canvas.
 *
 * Features:
 *   - Clean 3-column grid layout grouped by function
 *   - Gold-accented key binding badges (⌨ style)
 *   - Explanatory descriptions for each shortcut
 *   - Glassmorphism dark background with backdrop blur
 *   - Auto-dismiss on Escape or click outside
 *   - Smooth fade-in/out animation
 *
 * Layout:
 *   ┌────────────────────────────────────────────┐
 *   │  ⌨ Keyboard Shortcuts           [✕]       │
 *   ├─────────┬───────────┬─────────────────────┤
 *   │ VIEW    │ TOOLS     │ COMBAT              │
 *   │ G Grid  │ P Ping    │ Space Next          │
 *   │ F Fog   │ M Measure │ ⇧Spc Prev           │
 *   │ V DM    │ Esc Clear │ H HUD               │
 *   │ R Center│ 0 Clear R │                     │
 *   │ +/- Zoom│           │                     │
 *   └─────────┴───────────┴─────────────────────┘
 *
 * Cycle 25 (Premium Battlemap Overhaul — FINAL):
 *   - Comprehensive shortcut reference for DM power users
 *   - Premium glass styling consistent with the design system
 */

import { useEffect, useRef } from "react";

// ── Props ────────────────────────────────────────────────

interface KeyboardShortcutHintsProps {
  /** Whether the hints overlay is visible */
  visible: boolean;
  /** Called to dismiss the overlay */
  onDismiss: () => void;
}

// ── Shortcut data ──────────────────────────────────────

interface ShortcutGroup {
  title: string;
  icon: string;
  shortcuts: { key: string; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "View Controls",
    icon: "👁",
    shortcuts: [
      { key: "G", description: "Toggle grid overlay" },
      { key: "F", description: "Toggle fog of war" },
      { key: "V", description: "Toggle DM/player view" },
      { key: "R", description: "Recenter camera" },
      { key: "+/−", description: "Zoom in / zoom out" },
    ],
  },
  {
    title: "Tabletop Tools",
    icon: "🛠",
    shortcuts: [
      { key: "P", description: "Toggle ping mode" },
      { key: "M", description: "Toggle ruler mode" },
      { key: "Esc", description: "Cancel active tool" },
      { key: "0", description: "Clear ruler measurements" },
      { key: "H", description: "Toggle initiative HUD" },
    ],
  },
  {
    title: "Combat Flow",
    icon: "⚔",
    shortcuts: [
      { key: "Space", description: "Advance to next turn" },
      { key: "⇧+Space", description: "Go to previous turn" },
    ],
  },
];

// ── Component ───────────────────────────────────────────

export default function KeyboardShortcutHints({
  visible,
  onDismiss,
}: KeyboardShortcutHintsProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Dismiss on Escape
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visible, onDismiss]);

  // Dismiss on click outside
  useEffect(() => {
    if (!visible) return;
    const handleClick = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    // Delay to prevent the "?" key click itself from dismissing
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{
      background: "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(4px)",
    }}>
      {/* ── Card ── */}
      <div
        ref={overlayRef}
        className="rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          maxWidth: "620px",
          width: "90vw",
          background: "rgba(15, 16, 26, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(234, 179, 8, 0.06)",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
        }}>
          <div className="flex items-center gap-2.5">
            <span className="text-lg">⌨</span>
            <h2 className="text-sm font-bold text-gold-400">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-500 hover:text-gold-400 hover:bg-white/[0.04] transition-all duration-150"
          >
            ✕
          </button>
        </div>

        {/* ── Shortcut Grid ── */}
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title} className="space-y-3">
                {/* Group title */}
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{group.icon}</span>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-surface-400">
                    {group.title}
                  </h3>
                </div>

                {/* Shortcuts */}
                <div className="space-y-1.5">
                  {group.shortcuts.map((s) => (
                    <div key={s.key} className="flex items-center gap-2">
                      {/* Key badge */}
                      <span className="inline-flex items-center justify-center min-w-[4rem] px-2 py-1 text-[10px] font-mono font-bold rounded" style={{
                        background: "rgba(234, 179, 8, 0.08)",
                        color: "#eab308",
                        border: "1px solid rgba(234, 179, 8, 0.12)",
                      }}>
                        {s.key}
                      </span>
                      {/* Description */}
                      <span className="text-[11px] text-slate-300">{s.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Footer hint ── */}
          <div className="mt-5 pt-3 text-center" style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.04)",
          }}>
            <span className="text-[9px] text-surface-500">
              Press <span className="text-gold-400 font-mono font-bold">?</span> anytime on the map to show this reference
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
