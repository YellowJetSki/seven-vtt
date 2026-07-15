/* ── Command Palette ────────────────────────────────────────────
 * A Spotlight/Alfred-style command palette for quick navigation
 * and DM actions. Trigger with Cmd/Ctrl+K.
 *
 * Commands are registered in a central registry. The palette
 * filters commands by fuzzy search and executes on selection.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUiStore } from "@/stores/uiStore";

/* ── Command Registry ────────────────────────────────────────── */

interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  category: "navigation" | "action" | "combat" | "session";
  action: () => void;
}

// Global command registry
const _commands: Command[] = [];

export function registerCommand(cmd: Command) {
  _commands.push(cmd);
}

export function unregisterCommand(id: string) {
  const idx = _commands.findIndex((c) => c.id === id);
  if (idx >= 0) _commands.splice(idx, 1);
}

/* ── Component ──────────────────────────────────────────────── */

interface CommandPaletteProps {
  /** Optional override for routes. If not provided, uses react-router. */
  getNavigate?: () => (path: string) => void;
}

export function CommandPalette({ getNavigate }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const goTo = useCallback(
    (path: string) => {
      if (getNavigate) {
        getNavigate()(path);
      } else {
        navigate(path);
      }
    },
    [navigate, getNavigate],
  );

  // Store action functions in refs to avoid effect deps changing
  const goToRef = useRef(goTo);
  goToRef.current = goTo;

  // Register default commands
  useEffect(() => {
    const defaultCommands: Command[] = [
      { id: "nav-dashboard", label: "Go to Dashboard", icon: "◈", category: "navigation", action: () => goToRef.current("/dashboard") },
      { id: "nav-players", label: "Go to Player Cards", icon: "⚔", category: "navigation", action: () => goToRef.current("/players") },
      { id: "nav-homebrew", label: "Go to Homebrew Library", icon: "⚗", category: "navigation", action: () => goToRef.current("/homebrew") },
      { id: "nav-encounters", label: "Go to Combat Center", icon: "⚡", category: "navigation", action: () => goToRef.current("/encounters") },
      { id: "nav-maps", label: "Go to Battle Maps", icon: "🗺", category: "navigation", action: () => goToRef.current("/maps") },
      { id: "nav-journal", label: "Go to DM Journal", icon: "📖", category: "navigation", action: () => goToRef.current("/journal") },
      { id: "nav-settings", label: "Go to Campaign Settings", icon: "⚙", category: "navigation", action: () => goToRef.current("/settings") },
    ];
    defaultCommands.forEach((c) => registerCommand(c));
    return () => {
      defaultCommands.forEach((c) => unregisterCommand(c.id));
    };
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Filtered commands
  const filtered = useMemo(() => {
    if (!query.trim()) return _commands;
    const q = query.toLowerCase().trim();
    return _commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q),
    );
  }, [query]);

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
      setIsOpen(false);
      setQuery("");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-surface-950/60 backdrop-blur-sm"
      onClick={() => { setIsOpen(false); setQuery(""); }}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-xl border border-surface-700 bg-surface-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-surface-700 px-4 py-3">
          <span className="text-surface-500 text-sm">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none"
          />
          <span className="rounded-md border border-surface-600 px-1.5 py-0.5 text-[10px] text-surface-500">
            ESC
          </span>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-surface-500">No commands found.</p>
              {query && (
                <p className="text-xs text-surface-600 mt-1">Try a different search term.</p>
              )}
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  setIsOpen(false);
                  setQuery("");
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  idx === selectedIndex
                    ? "bg-accent-500/15 text-accent-300"
                    : "text-surface-300 hover:bg-surface-800"
                }`}
              >
                {cmd.icon && (
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-800 text-sm shrink-0">
                    {cmd.icon}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{cmd.label}</p>
                  {cmd.description && (
                    <p className="text-[11px] text-surface-500 truncate">{cmd.description}</p>
                  )}
                </div>
                <span className="rounded bg-surface-800 px-1.5 py-0.5 text-[10px] font-medium text-surface-500 capitalize shrink-0">
                  {cmd.category}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
