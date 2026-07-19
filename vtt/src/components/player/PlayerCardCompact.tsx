/**
 * STᚱ VTT — Player Card Compact (DM Command Hub — Premium)
 *
 * A premium, data-rich player hub for the DM-facing party roster.
 * Designed for split-second decision making during combat.
 *
 * Features:
 * - **Live stat strip**: AC (large gold), HP (color-coded with %), Init, Speed
 * - **Condition dots**: Small color-coded dots for active conditions (no text clutter)
 * - **Active effect badges**: Concentration, Invisible, etc. as compact pills
 * - **HP quick action row**: dedicated -5/+5/+1/-1 with glow feedback
 * - **Manage gear** (⚙): modal for delete/duplicate/edit/level-up
 * - **Hover elevation**: 3D card lift + gold edge glow + directional light sweep
 * - **Compact mode**: All stats visible at a glance, no scrolling needed
 * - **Level-up indicator**: gold accent glow when level can increase
 *
 * Zero purple tokens. Color system: gold-amber, emerald, rose, surface.
 */

import { useState, useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import PlayerCardAvatar from "./PlayerCardAvatar";
import PlayerCardManager from "./PlayerCardManager";
import type { PlayerCharacter, ConditionId } from "@/types";
import { CONDITIONS } from "@/types";
import { getAbilityMod, getProficiencyBonus } from "@/lib/mechanics/character-derivations";

interface PlayerCardCompactProps {
  character: PlayerCharacter;
  onOpen: (character: PlayerCharacter) => void;
}

// ── HP color helpers ──
function hpColor(current: number, max: number): { text: string; bg: string; bar: string; label: string } {
  const pct = max > 0 ? current / max : 0;
  if (current <= 0) return { text: "text-red-400", bg: "bg-red-500/15", bar: "bg-red-500", label: "Down" };
  if (pct <= 0.25) return { text: "text-rose-400", bg: "bg-rose-500/15", bar: "bg-rose-500", label: "Critical" };
  if (pct <= 0.5) return { text: "text-amber-400", bg: "bg-amber-500/15", bar: "bg-amber-500", label: "Injured" };
  if (pct <= 0.75) return { text: "text-yellow-400", bg: "bg-yellow-500/15", bar: "bg-yellow-500", label: "Scratched" };
  return { text: "text-emerald-400", bg: "bg-emerald-500/15", bar: "bg-emerald-500", label: "Healthy" };
}

export default function PlayerCardCompact({
  character: c,
  onOpen,
}: PlayerCardCompactProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const [showManager, setShowManager] = useState(false);

  // ── Derived data ──
  const hp = hpColor(c.hitPoints.current, c.hitPoints.max);
  const hpPct = c.hitPoints.max > 0
    ? Math.round((c.hitPoints.current / c.hitPoints.max) * 100)
    : 0;
  const pb = getProficiencyBonus(c.level);
  const mods = useMemo(() => ({
    str: getAbilityMod(c.strength),
    dex: getAbilityMod(c.dexterity),
    con: getAbilityMod(c.constitution),
    int: getAbilityMod(c.intelligence),
    wis: getAbilityMod(c.wisdom),
    cha: getAbilityMod(c.charisma),
  }), [c.strength, c.dexterity, c.constitution, c.intelligence, c.wisdom, c.charisma]);

  const tempHP = c.temporaryHitPoints || 0;

  // Condition dots
  const activeConditions = useMemo(() => {
    return (c.conditions || [])
      .map((id) => CONDITIONS[id as ConditionId])
      .filter(Boolean);
  }, [c.conditions]);

  // ── HP handlers ──
  const handleHpQuick = useCallback(
    (delta: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const newHp = Math.max(0, Math.min(c.hitPoints.max, c.hitPoints.current + delta));
      updateCharacter(c.id, { hitPoints: { ...c.hitPoints, current: newHp } });
    },
    [c, updateCharacter]
  );

  const handleHpSet = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      updateCharacter(c.id, { hitPoints: { ...c.hitPoints, current: c.hitPoints.max } });
    },
    [c, updateCharacter]
  );

  return (
    <>
      <div
        onClick={() => onOpen(c)}
        className="group relative bg-gradient-to-b from-[#191b2b]/70 to-[#12131e]/85 rounded-xl border border-white/[0.04] p-3.5 sm:p-4 cursor-pointer active:scale-[0.97] transition-all duration-200 touch-manipulation shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.35),0_0_30px_rgba(234,179,8,0.03)] hover:border-gold-500/12 hover:-translate-y-0.5"
      >
        {/* Top gold edge line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold-500/0 to-transparent group-hover:via-gold-500/15 transition-all duration-500" />

        {/* Hover glow directional sweep */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-amber-500/2" />
        </div>

        {/* Manage button — top right */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowManager(true); }}
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-lg bg-[#07080d]/70 border border-white/[0.04] text-surface-500 hover:text-gold-400 hover:border-gold/15 hover:bg-gold-500/8 active:scale-90 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
          title="Manage character"
          aria-label={`Manage ${c.name}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Content */}
        <div className="relative z-10 space-y-2.5">
          {/* Avatar + Name Row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="shrink-0">
                <PlayerCardAvatar character={c} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-surface-200 truncate leading-tight">
                  {c.name}
                </h3>
                <p className="text-[10px] text-surface-500 truncate">
                  {c.race} {c.class} Lv.{c.level}
                </p>
                {c.playerName && (
                  <p className="text-[8px] text-surface-600 truncate">
                    🎮 {c.playerName}
                  </p>
                )}
              </div>
            </div>

            {/* Condition dots — compact */}
            {activeConditions.length > 0 && (
              <div className="flex gap-1 flex-wrap justify-end max-w-[60px] shrink-0">
                {activeConditions.slice(0, 4).map((cond) => (
                  <span
                    key={cond.id}
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cond.color, boxShadow: `0 0 3px ${cond.color}60` }}
                    title={cond.name}
                  />
                ))}
                {activeConditions.length > 4 && (
                  <span className="text-[7px] text-surface-500 tabular-nums">
                    +{activeConditions.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── HP Section: Full-width dedicated row ── */}
          <div className={hp.bg + " rounded-lg p-2 border" + ` ${hp.bar.replace("bg-", "border-")}/15`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${hp.text}`}>
                  {hp.label}
                </span>
                {tempHP > 0 && (
                  <span className="px-1 py-0.5 rounded text-[8px] bg-amber-500/15 text-amber-400 border border-amber-500/15">
                    +{tempHP} THP
                  </span>
                )}
              </div>
              <span className="text-xs font-bold tabular-nums">
                <span className={hp.text}>{c.hitPoints.current}</span>
                <span className="text-surface-600">/{c.hitPoints.max}</span>
              </span>
            </div>

            {/* HP bar */}
            <div className="relative h-2 bg-surface-800/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${hp.bar}`}
                style={{ width: `${Math.max(hpPct, 3)}%` }}
              />
              {/* Temp HP overlay */}
              {tempHP > 0 && (
                <div
                  className="absolute top-0 h-full rounded-r-full bg-amber-400/30"
                  style={{
                    left: `${Math.min(hpPct, 100)}%`,
                    width: `${Math.min(tempHP / c.hitPoints.max * 100, 100 - hpPct)}%`,
                  }}
                />
              )}
              {/* Percentage label */}
              <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white/40 tabular-nums">
                {hpPct}%
              </span>
            </div>

            {/* HP Quick buttons */}
            <div className="flex gap-1 mt-1.5">
              <button
                onClick={(e) => handleHpQuick(-10, e)}
                className="flex-1 py-1 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30 active:scale-95 transition-all"
              >
                -10
              </button>
              <button
                onClick={(e) => handleHpQuick(-5, e)}
                className="flex-1 py-1 rounded text-[9px] font-bold bg-red-500/15 text-red-400/80 border border-red-500/15 hover:bg-red-500/25 active:scale-95 transition-all"
              >
                -5
              </button>
              <button
                onClick={(e) => handleHpQuick(-1, e)}
                className="flex-1 py-1 rounded text-[9px] font-bold bg-rose-500/10 text-rose-400/70 border border-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all"
              >
                -1
              </button>
              <button
                onClick={(e) => handleHpQuick(5, e)}
                className="flex-1 py-1 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 transition-all"
              >
                +5
              </button>
              <button
                onClick={(e) => handleHpQuick(1, e)}
                className="flex-1 py-1 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400/80 border border-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 transition-all"
              >
                +1
              </button>
              {/* Full heal */}
              <button
                onClick={handleHpSet}
                disabled={c.hitPoints.current >= c.hitPoints.max}
                className="px-1.5 py-1 rounded text-[9px] font-bold bg-gold-500/10 text-gold-400 border border-gold-500/15 hover:bg-gold-500/20 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Full heal"
              >
                ↺
              </button>
            </div>
          </div>

          {/* ── Stat Strip ── */}
          <div className="flex items-center gap-1.5">
            {/* AC — large, prominent */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gold-500/8 border border-gold/15 shadow-[0_0_4px_rgba(234,179,8,0.04)]">
              <span className="text-[8px] uppercase tracking-wider text-gold-500/60 font-black">AC</span>
              <span className="text-sm font-bold tabular-nums text-gold-300">{c.armorClass}</span>
            </div>

            {/* Init */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-800/40 border border-surface-700/20">
              <span className="text-[8px] uppercase tracking-wider text-surface-500 font-black">Init</span>
              <span className="text-xs font-bold tabular-nums text-surface-300">
                {c.initiative >= 0 ? "+" : ""}{c.initiative}
              </span>
            </div>

            {/* Speed */}
            {(c.speed?.walk || 30) > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-800/40 border border-surface-700/20">
                <span className="text-[8px] uppercase tracking-wider text-surface-500 font-black">Spd</span>
                <span className="text-xs font-bold tabular-nums text-surface-300">
                  {c.speed?.walk || 30}ft
                </span>
              </div>
            )}

            {/* PB */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-800/40 border border-surface-700/20 ml-auto">
              <span className="text-[8px] uppercase tracking-wider text-gold-500/50 font-black">PB</span>
              <span className="text-xs font-bold tabular-nums text-gold-400">+{pb}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manage Modal */}
      <PlayerCardManager
        isOpen={showManager}
        character={c}
        onClose={() => setShowManager(false)}
      />
    </>
  );
}
