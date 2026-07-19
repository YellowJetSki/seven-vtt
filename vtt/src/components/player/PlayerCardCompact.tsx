/**
 * STᚱ VTT — Player Card Compact (DM Command Hub — Premium Refactor)
 *
 * A premium, data-rich player hub for the DM-facing party roster.
 * IDENTICAL layout to the player-facing sheet for visual consistency.
 *
 * Now uses shared sub-components (CharacterHpGauge, CharacterStatBadge, ConditionDots)
 * for a unified codebase between player and DM views.
 *
 * Features:
 * - **Live stat strip**: AC (large gold), HP (color-coded with gauge), Init, Speed, PB
 * - **Condition dots**: Small color-coded dots for active conditions (no text clutter)
 * - **HP gauge with controls**: -10/-5/-1/+1/+5/↺ with glow feedback
 * - **Manage gear** (⚙): modal for delete/duplicate/edit/level-up
 * - **Hover elevation**: 3D card lift + gold edge glow + directional light sweep
 * - **Sprint 1 refactor**: ~120 lines → uses CharacterHpGauge, CharacterStatBadge, ConditionDots
 *
 * Zero purple tokens. Color system: gold-amber, emerald, rose, surface.
 */

import { useState, useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import PlayerCardAvatar from "./PlayerCardAvatar";
import PlayerCardManager from "./PlayerCardManager";
import CharacterHpGauge from "./CharacterHpGauge";
import CharacterStatBadge from "./CharacterStatBadge";
import ConditionDots from "./ConditionDots";
import type { PlayerCharacter } from "@/types";
import { getAbilityMod, getProficiencyBonus } from "@/lib/mechanics/character-derivations";

interface PlayerCardCompactProps {
  character: PlayerCharacter;
  onOpen: (character: PlayerCharacter) => void;
}

export default function PlayerCardCompact({
  character: c,
  onOpen,
}: PlayerCardCompactProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const [showManager, setShowManager] = useState(false);

  const pb = getProficiencyBonus(c.level);
  const mods = useMemo(() => ({
    dex: getAbilityMod(c.dexterity),
  }), [c.dexterity]);

  const initiative = c.initiative || mods.dex;

  // ── HP handler ──
  const handleHpChange = useCallback(
    (delta: number) => {
      const newHp = delta >= c.hitPoints.max
        ? c.hitPoints.max
        : Math.max(0, Math.min(c.hitPoints.max, c.hitPoints.current + delta));
      updateCharacter(c.id, { hitPoints: { ...c.hitPoints, current: newHp } });
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

            {/* Condition dots */}
            <ConditionDots conditionIds={c.conditions || []} />
          </div>

          {/* ── HP Gauge (shared with player sheet) ── */}
          <CharacterHpGauge character={c} onHpChange={handleHpChange} showControls />

          {/* ── Stat Strip ── */}
          <div className="flex items-center gap-1.5">
            {/* AC — large, prominent */}
            <CharacterStatBadge
              label="AC"
              value={c.armorClass}
              variant="gold"
              className="px-2 py-1"
            />

            {/* Init */}
            <CharacterStatBadge
              label="Init"
              value={initiative >= 0 ? `+${initiative}` : `${initiative}`}
              className="px-2 py-1"
            />

            {/* Speed */}
            <CharacterStatBadge
              label="Spd"
              value={`${c.speed?.walk || 30}ft`}
              className="px-2 py-1"
            />

            {/* PB — right aligned */}
            <CharacterStatBadge
              label="PB"
              value={`+${pb}`}
              className="px-2 py-1 ml-auto"
            />
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
