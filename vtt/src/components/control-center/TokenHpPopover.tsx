/**
 * STᚱ VTT — Token HP Popover (Premium Lusion Edition)
 *
 * Rapid DM token HP manipulation tool — instant popover on token click.
 * Allows the DM to adjust HP without opening the full token inspector.
 *
 * Features:
 * - Premium floating glass card with edge light + directional glow
 * - Token icon, label, type badge (player/enemy/npc)
 * - Large color-coded HP bar with fraction display
 * - Quick HP buttons: -10/-5/+5/+10 + custom input
 * - Temp HP display with gold accent
 * - Status effect indicator dots
 * - Enter animation (slide-in-up + fade)
 * - Auto-closes when clicking outside or pressing Escape
 * - Staggered entrance for sub-elements
 * - Consistent with premium design system glass tokens
 *
 * Architecture: Standalone popover that overlays the canvas.
 * Triggered by DmControlCenter when a token is clicked.
 * Writes HP changes immediately to Zustand → Firestore.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { MapToken } from "@/types";

// ── Type Definitions ──

export interface TokenHpPopoverProps {
  /** The token to display HP for */
  token: MapToken;
  /** Map ID (required for store writes) */
  mapId: string;
  /** Position relative to canvas container */
  position: { top: number; left: number };
  /** Called when popover wants to close */
  onClose: () => void;
  /** Called when HP is changed (updates store) */
  onHpChange: (tokenId: string, current: number, max: number) => void;
}

// ── HP Color Helper ──

function getHpColor(ratio: number): string {
  if (ratio > 0.75) return "text-emerald-400";
  if (ratio > 0.5) return "text-emerald-300";
  if (ratio > 0.25) return "text-amber-400";
  if (ratio > 0) return "text-red-400";
  return "text-rose-500";
}

function getHpBarColor(ratio: number): string {
  if (ratio > 0.75) return "bg-emerald-500";
  if (ratio > 0.5) return "bg-emerald-400";
  if (ratio > 0.25) return "bg-amber-500";
  if (ratio > 0) return "bg-red-500";
  return "bg-rose-500";
}

function getStatusLabel(current: number, max: number): string {
  const ratio = max > 0 ? current / max : 1;
  if (current <= 0 && max > 0) return "Dead";
  if (ratio <= 0.25) return "Critical";
  if (ratio <= 0.5) return "Bloodied";
  if (ratio <= 0.75) return "Injured";
  if (current < max) return "Scratched";
  return "Healthy";
}

function getStatusColor(ratio: number): string {
  if (ratio <= 0) return "text-rose-500";
  if (ratio <= 0.25) return "text-red-400";
  if (ratio <= 0.5) return "text-amber-400";
  if (ratio <= 0.75) return "text-emerald-300";
  return "text-emerald-400";
}

// ── Type Icon Map ──

const TYPE_ICONS: Record<string, string> = {
  player: "🛡️",
  enemy: "👹",
  npc: "🧙",
  custom: "✦",
};

// ── Main Component ──

export default function TokenHpPopover({
  token,
  mapId: _mapId,
  position,
  onClose,
  onHpChange,
}: TokenHpPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [hpCurrent, setHpCurrent] = useState(token.hp?.current ?? 0);
  const [hpMax, setHpMax] = useState(token.hp?.max ?? 1);
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [animPhase, setAnimPhase] = useState<"entering" | "idle" | "exiting">("entering");

  // Sync with token prop changes
  useEffect(() => {
    setHpCurrent(token.hp?.current ?? 0);
    setHpMax(token.hp?.max ?? 1);
  }, [token.hp?.current, token.hp?.max]);

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setAnimPhase("idle"), 50);
    return () => clearTimeout(t);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAnimPhase("exiting");
        setTimeout(onClose, 150);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setAnimPhase("exiting");
        setTimeout(onClose, 150);
      }
    };
    // Delay adding to avoid immediate trigger from the token click itself
    const t = setTimeout(() => document.addEventListener("mousedown", handleClick), 100);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const applyHp = useCallback(
    (newCurrent: number) => {
      const clamped = Math.max(0, Math.min(hpMax, newCurrent));
      setHpCurrent(clamped);
      onHpChange(token.id, clamped, hpMax);
    },
    [hpMax, token.id, onHpChange]
  );

  const handleDamage = useCallback(
    (amount: number) => applyHp(hpCurrent - amount),
    [hpCurrent, applyHp]
  );

  const handleHeal = useCallback(
    (amount: number) => applyHp(hpCurrent + amount),
    [hpCurrent, applyHp]
  );

  const handleCustomApply = useCallback(() => {
    const val = parseInt(customInput, 10);
    if (!isNaN(val)) {
      if (val >= 0) {
        setHpCurrent(Math.min(hpMax, val));
        onHpChange(token.id, Math.min(hpMax, val), hpMax);
      } else {
        // Negative values = damage
        handleDamage(Math.abs(val));
      }
    }
    setCustomInput("");
    setShowCustom(false);
  }, [customInput, hpMax, token.id, onHpChange, handleDamage]);

  const handleCustomKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleCustomApply();
      if (e.key === "Escape") {
        setShowCustom(false);
        setCustomInput("");
      }
    },
    [handleCustomApply]
  );

  const hpRatio = hpMax > 0 ? hpCurrent / hpMax : 1;
  const typeIcon = TYPE_ICONS[token.type] ?? "✦";

  // Clamp position to viewport
  const clampedLeft = Math.max(8, Math.min(position.left, window.innerWidth - 340));
  const clampedTop = Math.max(8, Math.min(position.top, window.innerHeight - 420));

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-[320px] select-none"
      style={{
        left: `${clampedLeft}px`,
        top: `${clampedTop}px`,
        animation: animPhase === "exiting"
          ? "fade-out 0.15s ease-out forwards"
          : "slide-in-up 0.25s ease-out both",
      }}
    >
      {/* Glass card container */}
      <div className="relative bg-gradient-to-b from-[#1a1c2a]/95 to-[#0f101a]/98 backdrop-blur-2xl border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden group">
        {/* Edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent pointer-events-none" />

        {/* Directional glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/[0.015] via-transparent to-amber-500/[0.01] pointer-events-none" />

        {/* Content */}
        <div className="relative z-[1] p-4 space-y-3">
          {/* ── Header row ── */}
          <div className="flex items-center gap-3" style={{ animation: "slide-in-up 0.2s ease-out both" }}>
            {/* Token icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border shrink-0"
              style={{
                backgroundColor: `${token.color}20`,
                borderColor: `${token.color}30`,
              }}
            >
              <span aria-hidden="true">{token.icon || typeIcon}</span>
            </div>

            {/* Label + type */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-surface-200 truncate max-w-[180px]">
                  {token.label}
                </span>
                <span className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                  token.type === "player"
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/15"
                    : token.type === "enemy"
                      ? "bg-red-500/10 text-red-400 border-red-500/15"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/15"
                }`}>
                  {token.type}
                </span>
              </div>
              {/* Status label */}
              <span className={`text-[10px] font-medium ${getStatusColor(hpRatio)}`}>
                {getStatusLabel(hpCurrent, hpMax)}
              </span>
            </div>

            {/* Close button */}
            <button
              onClick={() => { setAnimPhase("exiting"); setTimeout(onClose, 150); }}
              className="shrink-0 p-1 rounded-lg hover:bg-white/[0.06] text-surface-500 hover:text-surface-200 transition-all duration-200 active:scale-90"
              aria-label="Close popover"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── HP Bar ── */}
          <div style={{ animation: "slide-in-up 0.2s ease-out 0.04s both" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider text-surface-500 font-medium">HP</span>
              <span className={`text-sm font-bold font-mono tabular-nums ${getHpColor(hpRatio)}`}>
                {hpCurrent}
                <span className="text-surface-600 text-xs font-normal"> / {hpMax}</span>
              </span>
            </div>
            <div className="h-2.5 bg-[#0c0d15] rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${getHpBarColor(hpRatio)}`}
                style={{ width: `${Math.max(0, hpRatio * 100)}%`, boxShadow: hpRatio > 0 ? `0 0 8px ${hpRatio > 0.5 ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}` : 'none' }}
              />
            </div>
          </div>

          {/* ── Quick HP Buttons ── */}
          <div className="grid grid-cols-5 gap-1.5" style={{ animation: "slide-in-up 0.2s ease-out 0.08s both" }}>
            <button
              onClick={() => handleDamage(10)}
              className="px-1 py-2 rounded-xl text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/10 hover:bg-red-500/15 hover:border-red-500/20 active:scale-90 transition-all duration-150"
            >
              -10
            </button>
            <button
              onClick={() => handleDamage(5)}
              className="px-1 py-2 rounded-xl text-[10px] font-bold bg-red-500/8 text-red-400/80 border border-red-500/8 hover:bg-red-500/12 hover:border-red-500/15 active:scale-90 transition-all duration-150"
            >
              -5
            </button>
            <button
              onClick={() => handleDamage(1)}
              className="px-1 py-2 rounded-xl text-[10px] font-bold bg-red-500/6 text-red-400/60 border border-red-500/6 hover:bg-red-500/10 hover:border-red-500/12 active:scale-90 transition-all duration-150"
            >
              -1
            </button>
            <button
              onClick={() => handleHeal(1)}
              className="px-1 py-2 rounded-xl text-[10px] font-bold bg-emerald-500/6 text-emerald-400/60 border border-emerald-500/6 hover:bg-emerald-500/10 hover:border-emerald-500/12 active:scale-90 transition-all duration-150"
            >
              +1
            </button>
            <button
              onClick={() => handleHeal(5)}
              className="px-1 py-2 rounded-xl text-[10px] font-bold bg-emerald-500/8 text-emerald-400/80 border border-emerald-500/8 hover:bg-emerald-500/12 hover:border-emerald-500/15 active:scale-90 transition-all duration-150"
            >
              +5
            </button>
          </div>

          {/* ── Second row: +10 and set ── */}
          <div className="flex gap-1.5" style={{ animation: "slide-in-up 0.2s ease-out 0.12s both" }}>
            <button
              onClick={() => handleHeal(10)}
              className="flex-1 px-2 py-2 rounded-xl text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 hover:bg-emerald-500/15 hover:border-emerald-500/20 active:scale-90 transition-all duration-150"
            >
              +10 Heal
            </button>
            <button
              onClick={() => {
                setShowCustom(true);
                setCustomInput(hpCurrent.toString());
              }}
              className="flex-1 px-2 py-2 rounded-xl text-[10px] font-bold bg-gold-500/10 text-gold-400 border border-gold-500/10 hover:bg-gold-500/15 hover:border-gold-500/20 active:scale-90 transition-all duration-150"
            >
              ✎ Set HP
            </button>
          </div>

          {/* ── Custom HP Input ── */}
          {showCustom && (
            <div
              className="flex items-center gap-2"
              style={{ animation: "slide-in-up 0.15s ease-out both" }}
            >
              <input
                type="number"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={handleCustomKeyDown}
                min={0}
                max={hpMax}
                className="flex-1 px-3 py-2 rounded-xl text-sm bg-[#0c0d15] border border-gold-500/25 text-gold-300 font-mono focus:outline-none focus:border-gold-500/40 focus:ring-1 focus:ring-gold-500/20 transition-all duration-200"
                placeholder={`0–${hpMax}`}
                autoFocus
              />
              <button
                onClick={handleCustomApply}
                className="px-3 py-2 rounded-xl text-[10px] font-bold bg-gold-500/15 text-gold-400 border border-gold-500/20 hover:bg-gold-500/20 active:scale-90 transition-all duration-150"
              >
                Apply
              </button>
            </div>
          )}

          {/* ── Status Effect Dots ── */}
          {token.statusMarkers && token.statusMarkers.length > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]" style={{ animation: "slide-in-up 0.2s ease-out 0.16s both" }}>
              <span className="text-[9px] uppercase tracking-wider text-surface-600 font-medium">Effects</span>
              <div className="flex gap-1">
                {token.statusMarkers.map((marker, i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: marker === "poisoned" ? "#22c55e" : marker === "paralyzed" ? "#f59e0b" : marker === "unconscious" ? "#ef4444" : marker === "invisible" ? "#8b5cf6" : marker === "concentrating" ? "#eab308" : marker === "restrained" ? "#f97316" : marker === "prone" ? "#a1a1aa" : "#eab308" }}
                    title={marker}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Quick Stats footer ── */}
          <div className="flex items-center gap-3 pt-1 text-[9px] text-surface-600" style={{ animation: "slide-in-up 0.2s ease-out 0.2s both" }}>
            <span>Pos: ({token.x}, {token.y})</span>
            {token.speed && <span>Speed: {token.speed}ft</span>}
            {token.initiative !== undefined && <span>Init: {token.initiative > 0 ? `+${token.initiative}` : token.initiative}</span>}
            <div className="flex-1" />
            <span className="text-surface-700 italic">Tap outside to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
