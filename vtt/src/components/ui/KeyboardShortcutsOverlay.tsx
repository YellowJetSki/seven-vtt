/* ── Keyboard Shortcuts Overlay ────────────────────────────────
 * Press '?' to toggle the shortcuts help dialog.
 * Shows all available keyboard shortcuts for the VTT.
 *
 * UPGRADED: More combat shortcuts, session management, and
 * application-wide actions.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";

interface Shortcut {
  key: string;
  description: string;
  category: "navigation" | "combat" | "session" | "general";
}

const SHORTCUTS: Shortcut[] = [
  { key: "?", description: "Toggle this shortcuts dialog", category: "general" },
  { key: "Esc", description: "Close modal / dialog / palette", category: "general" },
  { key: "Ctrl+K", description: "Open command palette", category: "general" },
  { key: "Ctrl+Shift+N", description: "Toggle scratch pad", category: "general" },
  { key: "Ctrl+Shift+T", description: "Toggle session notes", category: "general" },
  { key: "Ctrl+/", description: "Show keyboard shortcuts", category: "general" },
  { key: "Ctrl+Shift+E", description: "Export current data", category: "general" },

  { key: "1", description: "Dashboard", category: "navigation" },
  { key: "2", description: "Player Cards", category: "navigation" },
  { key: "3", description: "Homebrew Library", category: "navigation" },
  { key: "4", description: "Combat Center", category: "navigation" },
  { key: "5", description: "Battle Maps", category: "navigation" },
  { key: "6", description: "DM Journal", category: "navigation" },
  { key: "7", description: "Campaign Settings", category: "navigation" },

  { key: "Space", description: "Next combat turn", category: "combat" },
  { key: "Shift+Space", description: "Previous combat turn", category: "combat" },
  { key: "S", description: "Start / resume encounter", category: "combat" },
  { key: "P", description: "Pause / unpause combat", category: "combat" },
  { key: "E", description: "End encounter", category: "combat" },
  { key: "D", description: "Damage selected combatant", category: "combat" },
  { key: "H", description: "Heal selected combatant", category: "combat" },

  { key: "Ctrl+N", description: "New encounter", category: "session" },
  { key: "Ctrl+R", description: "Record a short rest", category: "session" },
  { key: "Ctrl+Shift+R", description: "Record a long rest", category: "session" },
  { key: "Ctrl+S", description: "Toggle session live/offline", category: "session" },
];

const CATEGORY_LABELS: Record<string, string> = {
  navigation: "Navigation",
  combat: "Combat Controls",
  session: "Session Management",
  general: "General",
};

const CATEGORY_COLORS: Record<string, string> = {
  navigation: "text-mage-400 border-mage-500/20",
  combat: "text-warrior-400 border-warrior-500/20",
  session: "text-divine-400 border-divine-500/20",
  general: "text-surface-400 border-surface-700",
};

export function KeyboardShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((o) => !o), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle with '?'
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        toggle();
        return;
      }

      // Close with Escape
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggle, isOpen]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(SHORTCUTS.map((s) => s.category)));

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-[201] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-surface-700 bg-surface-850 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-700 px-5 py-4">
          <h2 className="text-lg font-semibold text-surface-100">⌨ Keyboard Shortcuts</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-surface-400 hover:bg-surface-700 hover:text-surface-200"
          >
            ✕
          </button>
        </div>

        {/* Shortcuts by category */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-4">
          {categories.map((category) => (
            <div key={category}>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${CATEGORY_COLORS[category]}`}>
                {CATEGORY_LABELS[category] ?? category}
              </h3>
              <div className="space-y-1">
                {SHORTCUTS.filter((s) => s.category === category).map((shortcut) => (
                  <div
                    key={shortcut.key + shortcut.category}
                    className="flex items-center justify-between rounded-md bg-surface-800 px-3 py-2"
                  >
                    <span className="text-sm text-surface-300">{shortcut.description}</span>
                    <kbd className="rounded-md border border-surface-600 bg-surface-700 px-2 py-0.5 text-xs font-mono font-bold text-surface-200 shadow-sm">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-surface-700 px-5 py-3 text-center text-[10px] text-surface-600">
          Press <kbd className="rounded border border-surface-600 bg-surface-700 px-1.5 py-0.5 text-[10px] font-mono">?</kbd> to toggle this dialog anytime
        </div>
      </div>
    </>
  );
}
