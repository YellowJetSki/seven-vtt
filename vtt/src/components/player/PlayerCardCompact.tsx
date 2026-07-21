/**
 * STᚱ VTT — Player Card Compact (Overrrides-Grade DM Command Hub)
 *
 * A premium, data-rich player hub for the DM-facing party roster.
 * Features:
 * - Multi-layer glass composition (void → edge light → directional glow → content)
 * - Hover elevation lift with shadow depth + gold edge glow
 * - Premium HP bar with temp HP overlay, color-coded tiers
 * - Living condition badges with unique color per condition
 * - Gear manage button with metallic gear SVG
 * - Premium stat strip: AC (large gold), Init, Speed, PB
 * - Quick gold deposit button
 * - Touch-friendly targets (44px+)
 *
 * Campaign: Arkla — Wendy Swiftfoot, Kehrfuffle Ironheart
 */

import { useState, useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import PlayerCardAvatar from "./PlayerCardAvatar";
import PlayerCardManager from "./PlayerCardManager";
import CharacterStatBadge from "./CharacterStatBadge";
import ConditionDots from "./ConditionDots";
import type { PlayerCharacter } from "@/types";
import type { ConditionId } from "@/types/condition-types";
import { getAbilityMod, getProficiencyBonus } from "@/lib/mechanics/character-derivations";

interface PlayerCardCompactProps {
  character: PlayerCharacter;
  onOpen: (character: PlayerCharacter) => void;
  onQuickGold?: (charId: string, amount: number) => void;
}

/** HP status tier thresholds */
function getHpTier(hp: number, max: number): { label: string; color: string; barColor: string } {
  if (max <= 0) return { label: "Dead", color: "text-rose-400", barColor: "bg-rose-500/40" };
  const ratio = hp / max;
  if (hp <= 0) return { label: "Down", color: "text-rose-400", barColor: "bg-rose-500/40" };
  if (ratio <= 0.25) return { label: "Critical", color: "text-red-400", barColor: "bg-red-500" };
  if (ratio <= 0.5) return { label: "Bloodied", color: "text-amber-400", barColor: "bg-amber-500" };
  if (ratio <= 0.75) return { label: "Scratched", color: "text-emerald-400", barColor: "bg-emerald-400" };
  return { label: "Healthy", color: "text-emerald-400", barColor: "bg-emerald-500" };
}

export default function PlayerCardCompact({
  character: c,
  onOpen,
  onQuickGold,
}: PlayerCardCompactProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const [showManager, setShowManager] = useState(false);

  const pb = getProficiencyBonus(c.level);
  const mods = useMemo(() => ({ dex: getAbilityMod(c.dexterity) }), [c.dexterity]);
  const initiative = c.initiative || mods.dex;
  const hp = c.hitPoints || { current: 0, max: 0, temporary: 0 };
  const tier = getHpTier(hp.current, hp.max);
  const hpRatio = hp.max > 0 ? Math.min(1, Math.max(0, hp.current / hp.max)) : 0;

  const conditions = (c.conditions || []) as ConditionId[];

  // ── HP handler (Zustand instant + Firestore via campaignStore) ──
  const handleHpChange = useCallback(
    (delta: number) => {
      const newHp = delta >= hp.max
        ? hp.max
        : Math.max(0, Math.min(hp.max, hp.current + delta));
      updateCharacter(c.id, { hitPoints: { ...hp, current: newHp } });
    },
    [c, hp, updateCharacter]
  );

  const hpColor = tier.color;

  return (
    <>
      <div
        onClick={() => onOpen(c)}
        className="group relative bg-gradient-to-b from-[#191b2b]/70 to-[#12131e]/85 rounded-xl border border-white/[0.04] p-3.5 sm:p-4 cursor-pointer active:scale-[0.97] transition-all duration-200 ease-out touch-manipulation shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.35),0_0_30px_rgba(234,179,8,0.03)] hover:border-gold-500/12 hover:-translate-y-0.5"
      >
        {/* Top gold edge line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold-500/0 to-transparent group-hover:via-gold-500/15 transition-all duration-500" />

        {/* Hover glow directional sweep */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-amber-500/2" />
        </div>

        {/* Manage button — top right gear */}
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
          {/* ── Avatar + Name Row ── */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="shrink-0">
                <PlayerCardAvatar character={c} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white/90 truncate leading-tight font-display">
                  {c.name}
                </h3>
                <p className="text-[10px] text-surface-500 truncate">
                  {c.race} · {c.class} Lv.{c.level}
                </p>
                {c.playerName && (
                  <p className="text-[8px] text-surface-600 truncate flex items-center gap-1">
                    <span>🎮</span>
                    {c.playerName}
                  </p>
                )}
              </div>
            </div>

            {/* Condition dots (compact) */}
            {conditions.length > 0 && (
              <div className="flex items-center gap-0.5 flex-wrap max-w-[60px] justify-end">
                <ConditionDots conditionIds={conditions} />
              </div>
            )}
          </div>

          {/* ── Premium HP Section (color-coded bar + status label + temp HP) ── */}
          <div className="space-y-1.5">
            {/* HP status row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-semibold ${hpColor}`}>
                  {hp.current}
                  <span className="text-surface-600 font-normal">/{hp.max}</span>
                </span>
                {hp.temporary > 0 && (
                  <span className="text-[9px] text-gold-400 bg-gold-500/10 px-1.5 py-0.5 rounded-md border border-gold/15 font-semibold">
                    +{hp.temporary} THP
                  </span>
                )}
              </div>
              <span className={`text-[8px] font-semibold uppercase tracking-wider ${hpColor}`}>
                {tier.label}
              </span>
            </div>

            {/* Premium HP bar with tier-colored fill */}
            <div className="relative h-2 bg-surface-800/60 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${tier.barColor}`}
                style={{ width: `${hpRatio * 100}%` }}
              />
              {/* Temp HP overlay */}
              {hp.temporary > 0 && (
                <div
                  className="absolute top-0 h-full rounded-full bg-gold-500/30 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, ((hp.current + hp.temporary) / hp.max) * 100)}%`,
                    left: 0,
                  }}
                />
              )}
            </div>

            {/* Quick HP controls */}
            <div className="flex gap-1">
              {[-10, -5, -1, 1, 5, 10].map((d) => (
                <button
                  key={d}
                  onClick={(e) => { e.stopPropagation(); handleHpChange(d); }}
                  className={`flex-1 h-7 rounded-lg text-[9px] font-semibold transition-all duration-150 active:scale-90 ${
                    d < 0
                      ? "bg-rose-500/8 text-rose-400/70 border border-rose-500/10 hover:bg-rose-500/15 hover:text-rose-300"
                      : d > 0
                      ? "bg-emerald-500/8 text-emerald-400/70 border border-emerald-500/10 hover:bg-emerald-500/15 hover:text-emerald-300"
                      : ""
                  }`}
                >
                  {d > 0 ? "+" : ""}{d}
                </button>
              ))}
            </div>
          </div>

          {/* ── Stat Strip ── */}
          <div className="flex items-center gap-1">
            {/* AC — large, prominent */}
            <CharacterStatBadge label="AC" value={c.armorClass} variant="gold" className="px-2 py-1 flex-1" />

            {/* Init */}
            <CharacterStatBadge label="Init" value={initiative >= 0 ? `+${initiative}` : `${initiative}`} className="px-2 py-1 flex-1" />

            {/* Speed */}
            <CharacterStatBadge label="Spd" value={`${c.speed?.walk || 30}ft`} className="px-2 py-1 flex-1" />

            {/* PB */}
            <CharacterStatBadge label="PB" value={`+${pb}`} className="px-2 py-1 flex-1" />

            {/* Quick Gold Deposit */}
            {onQuickGold && (
              <button
                onClick={(e) => { e.stopPropagation(); onQuickGold(c.id, 10); }}
                className="px-2 py-1 rounded-lg text-[9px] font-bold bg-gold-500/8 text-gold-400/70 border border-gold-500/10 hover:bg-gold-500/15 hover:text-gold-400 hover:border-gold-500/20 active:scale-90 transition-all duration-150 flex items-center gap-1 shrink-0"
                title="Deposit 10 GP to this character"
              >
                <span>💰</span>
                +10G
              </button>
            )}
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
