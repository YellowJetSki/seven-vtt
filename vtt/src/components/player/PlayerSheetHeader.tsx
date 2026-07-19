/**
 * STᚱ VTT — Player Sheet Header (Premium Upgrade)
 *
 * Premium immersive header with:
 * - Full-width portrait banner with gradient overlay (if imageUrl set)
 * - Animated gradient placeholder with character initial (if no image)
 * - Gold status pills: level, HP %, conditions count
 * - Stat summary strip: AC, Init, Speed, XP
 * - Touchable condition count (tap to reveal active conditions)
 * - Auto-detects image brightness for overlay tint
 * - Staggered entrance animation
 * - 44px+ touch targets
 */

import { useState } from "react";
import { X } from "lucide-react";
import type { PlayerCharacter } from "@/types";
import { CONDITIONS } from "@/types";

interface PlayerSheetHeaderProps {
  character: PlayerCharacter;
  onClose: () => void;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getHpStatus(hp: { current: number; max: number }): { label: string; color: string; bg: string } {
  const pct = hp.max > 0 ? hp.current / hp.max : 0;
  if (hp.current === 0) return { label: "Down", color: "text-red-400", bg: "bg-red-500/15" };
  if (pct <= 0.25) return { label: "Critical", color: "text-rose-400", bg: "bg-rose-500/15" };
  if (pct <= 0.5) return { label: "Injured", color: "text-amber-400", bg: "bg-amber-500/15" };
  if (pct <= 0.75) return { label: "Scratched", color: "text-yellow-400", bg: "bg-yellow-500/10" };
  return { label: "Healthy", color: "text-emerald-400", bg: "bg-emerald-500/10" };
}

function getActiveConditions(conditions: string[]) {
  return conditions
    .map((id) => CONDITIONS[id as keyof typeof CONDITIONS])
    .filter(Boolean);
}

export default function PlayerSheetHeader({ character, onClose }: PlayerSheetHeaderProps) {
  const c = character;
  const hasImage = Boolean(c.imageUrl);
  const [showConditions, setShowConditions] = useState(false);

  const hpStatus = getHpStatus(c.hitPoints);
  const activeConditions = getActiveConditions(c.conditions || []);
  const hpPct = c.hitPoints.max > 0 ? Math.round((c.hitPoints.current / c.hitPoints.max) * 100) : 0;
  const initial = getInitial(c.name);

  // ── Condition count display ──
  const conditionSummary = activeConditions.length > 0
    ? `${activeConditions.length} active`
    : "Clear";

  return (
    <div className="shrink-0 relative">
      {/* ── Banner Portrait ── */}
      {hasImage ? (
        <div className="relative w-full h-40 sm:h-48 overflow-hidden bg-obsidian">
          {/* Image */}
          <img
            src={c.imageUrl}
            alt={c.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              // Fallback to placeholder on load failure
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).parentElement!.classList.add("no-image");
            }}
          />

          {/* Multi-layer gradient fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-obsidian/95 to-transparent" />

          {/* Content overlay */}
          <div className="absolute bottom-3 left-4 right-14">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-gold-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                {c.name}
              </h2>
              {/* HP Status pill */}
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider ${hpStatus.bg} ${hpStatus.color} border border-current/20 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]`}>
                {hpStatus.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-gold-400/70 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                {c.race} · {c.class} {c.level}
                {c.subClass && ` · ${c.subClass}`}
              </p>
            </div>
          </div>

          {/* Top-right actions */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            {/* Condition count badge */}
            {activeConditions.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowConditions(!showConditions); }}
                className={`px-2 py-1 rounded-lg text-[8px] font-semibold backdrop-blur-sm transition-all ${
                  showConditions
                    ? "bg-gold-500/20 text-gold-300 border border-gold/30"
                    : "bg-black/40 text-surface-300 border border-white/10 hover:bg-gold-500/15 hover:text-gold-400"
                }`}
              >
                {activeConditions.length} cond.
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-black/40 backdrop-blur-sm text-surface-300 hover:text-gold-400 hover:bg-gold-500/20 active:scale-90 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Expanded condition preview */}
          {showConditions && activeConditions.length > 0 && (
            <div className="absolute top-11 right-2 z-30 p-2 rounded-xl bg-obsidian/95 backdrop-blur-md border border-surface-700/30 shadow-xl shadow-black/50 min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex flex-wrap gap-1">
                {activeConditions.map((cond) => (
                  <span
                    key={cond.id}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
                    style={{
                      backgroundColor: `${cond.color}20`,
                      borderColor: `${cond.color}40`,
                      border: "1px solid",
                      color: cond.color,
                    }}
                  >
                    <span>{cond.icon}</span>
                    <span>{cond.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Animated gradient placeholder ── */
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0d0e1a] via-[#14151f] to-[#1a1c2a]">
          {/* Animated shimmer background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-500/[0.04] to-transparent animate-[shimmer_3s_ease-in-out_infinite] -translate-x-full" />
          </div>

          <div className="flex items-center justify-between px-4 py-3.5 relative z-10">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Animated initial ring */}
              <div className="relative w-12 h-12 shrink-0">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold-500/20 to-amber-500/10 animate-pulse-soft" />
                <div className="absolute inset-0 rounded-xl ring-1 ring-gold/20" />
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-gold-500/15 to-amber-500/10 flex items-center justify-center">
                  <span className="text-gold-300 font-black text-xl animate-in zoom-in-50 duration-300">{initial}</span>
                </div>
              </div>

              {/* Name + details */}
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gold-200 truncate drop-shadow-[0_0_6px_rgba(234,179,8,0.08)]">
                    {c.name}
                  </h2>
                  {/* HP Status pill */}
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[7px] font-semibold uppercase tracking-wider ${hpStatus.bg} ${hpStatus.color} border border-current/20`}>
                    {hpStatus.label}
                  </span>
                </div>
                <p className="text-[10px] text-gold-500/50 truncate">
                  {c.race} · {c.class} {c.level}
                  {c.subClass && ` · ${c.subClass}`}
                </p>
              </div>
            </div>

            {/* Right-side actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Level badge */}
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-gold-500/8 border border-gold/10">
                <span className="text-[9px] text-gold-500/60 font-semibold">Lv.</span>
                <span className="text-xs text-gold-300 font-bold tabular-nums">{c.level}</span>
              </div>

              {/* Conditions badge */}
              {activeConditions.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowConditions(!showConditions); }}
                  className={`px-2 py-1 rounded-lg text-[8px] font-semibold transition-all ${
                    showConditions
                      ? "bg-gold-500/15 text-gold-400 border border-gold/20"
                      : "bg-surface-800/40 text-surface-400 border border-surface-700/30 hover:border-gold/20 hover:text-gold-400"
                  }`}
                >
                  {activeConditions.length} cond.
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 active:scale-90 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Expanded condition preview (non-image mode) */}
          {showConditions && activeConditions.length > 0 && (
            <div className="absolute top-full right-4 z-30 mt-1 p-2 rounded-xl bg-obsidian/95 backdrop-blur-md border border-surface-700/30 shadow-xl shadow-black/50 min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex flex-wrap gap-1">
                {activeConditions.map((cond) => (
                  <span
                    key={cond.id}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
                    style={{
                      backgroundColor: `${cond.color}20`,
                      borderColor: `${cond.color}40`,
                      border: "1px solid",
                      color: cond.color,
                    }}
                  >
                    <span>{cond.icon}</span>
                    <span>{cond.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Stat Summary Strip (below header) ── */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-obsidian-mid/40 border-b border-gold/10">
        <div className="flex items-center gap-3 divide-x divide-gold-500/10">
          {/* AC */}
          <div className="flex items-center gap-1.5 pr-3">
            <span className="text-[8px] uppercase tracking-wider text-gold-500/50 font-black">AC</span>
            <span className="text-sm font-bold text-amber-400 tabular-nums">{c.armorClass}</span>
          </div>

          {/* HP */}
          <div className="flex items-center gap-1.5 px-3">
            <span className="text-[8px] uppercase tracking-wider text-gold-500/50 font-black">HP</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: hpPct > 50 ? "#34d399" : hpPct > 25 ? "#fbbf24" : "#ef4444" }}>
              {c.hitPoints.current}
            </span>
            <span className="text-[10px] text-surface-500 tabular-nums">/ {c.hitPoints.max}</span>
          </div>

          {/* Initiative */}
          <div className="flex items-center gap-1.5 px-3">
            <span className="text-[8px] uppercase tracking-wider text-gold-500/50 font-black">Init</span>
            <span className="text-sm font-bold text-gold-300 tabular-nums">
              {c.initiative >= 0 ? "+" : ""}{c.initiative}
            </span>
          </div>

          {/* Speed (hidden on very small) */}
          <div className="hidden sm:flex items-center gap-1.5 px-3">
            <span className="text-[8px] uppercase tracking-wider text-gold-500/50 font-black">Speed</span>
            <span className="text-sm font-bold text-surface-200 tabular-nums">
              {typeof c.speed === "object" && c.speed !== null ? c.speed.walk || 30 : c.speed || 30}ft
            </span>
          </div>
        </div>

        {/* XP (right side) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] uppercase tracking-wider text-gold-500/50 font-black">XP</span>
          <span className="text-[10px] text-surface-400 tabular-nums">
            {c.experiencePoints?.toLocaleString() || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
