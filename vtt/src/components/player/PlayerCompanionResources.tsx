/**
 * STᚱ VTT — Player Companion Resources (Overrrides-Grade Premium)
 *
 * Cycle 42: Tactical resource panel for the companion live encounter view.
 * Shows the player's key resources at a glance during their turn:
 *   - Spell slots per level (if caster) with colored gauge bars
 *   - Hit dice remaining
 *   - Class resources (rage, ki points, channel divinity, etc.)
 *
 * Features:
 *   - Compact grid layout perfect for the companion overlay
 *   - Color-coded spell slot gauges (green=full, amber=partial, red=exhausted)
 *   - Hit dice count with die type display
 *   - Resource name + current/max with progress bar
 *   - "No Resources" empty state for non-caster martials
 *   - Premium glassmorphism + staggered entrance animations
 *
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { useMemo } from "react";
import type { PlayerCharacter } from "@/types";
import { computeSpellcasting } from "@/lib/mechanics/character-derivations";

interface PlayerCompanionResourcesProps {
  character: PlayerCharacter;
}

/** Short 1-letter level label for compact display */
function levelLabel(lvl: number): string {
  if (lvl === 0) return "C";
  return `${lvl}`;
}

/** Color tier for spell slot gauges */
function slotTier(current: number, max: number): { bar: string; text: string } {
  if (max <= 0) return { bar: "bg-surface-800/30", text: "text-surface-700" };
  const r = current / max;
  if (r <= 0) return { bar: "bg-red-500/40", text: "text-red-400" };
  if (r <= 0.25) return { bar: "bg-red-500/50", text: "text-red-300" };
  if (r <= 0.5) return { bar: "bg-amber-500/50", text: "text-amber-300" };
  if (r < 1) return { bar: "bg-gold-500/50", text: "text-gold-300" };
  return { bar: "bg-emerald-500/60", text: "text-emerald-300" };
}

/** Class resource color mapping */
function resourceColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("rage")) return "bg-rose-500/50";
  if (n.includes("ki") || n.includes("sorcery")) return "bg-indigo-500/50";
  if (n.includes("bardic")) return "bg-pink-500/50";
  if (n.includes("channel") || n.includes("divinity")) return "bg-gold-500/50";
  if (n.includes("wild") || n.includes("shape")) return "bg-emerald-500/50";
  if (n.includes("action") || n.includes("surge") || n.includes("second wind")) return "bg-amber-500/50";
  return "bg-sky-500/50";
}

export default function PlayerCompanionResources({ character }: PlayerCompanionResourcesProps) {
  const spellcasting = useMemo(() => computeSpellcasting(character), [character]);
  const isCaster = spellcasting.isCaster && spellcasting.spellSlots !== null;

  // Build spell slot levels that have max > 0
  const slotLevels = useMemo(() => {
    if (!isCaster || !spellcasting.spellSlots) return [];
    const levels: Array<{ level: number; current: number; max: number }> = [];
    for (let lv = 1; lv <= 9; lv++) {
      const key = `level${lv}` as keyof typeof spellcasting.spellSlots;
      const slot = spellcasting.spellSlots[key];
      if (slot && slot.max > 0) {
        levels.push({ level: lv, current: slot.current, max: slot.max });
      }
    }
    return levels;
  }, [isCaster, spellcasting.spellSlots]);

  // Resources from character
  const resources = character.resources || [];
  const hasResources = resources.length > 0;

  // Compute hit dice info
  const hitDieMap: Record<string, number> = {
    "d6": 6, "d8": 8, "d10": 10, "d12": 12,
  };
  const classNames = character.classes?.length
    ? character.classes.map((c) => c.name)
    : [character.class];
  // Derive likely hit die from class
  const classHitDie: Record<string, string> = {
    Barbarian: "d12", Fighter: "d10", Paladin: "d10", Ranger: "d10",
    Cleric: "d8", Druid: "d8", Monk: "d8", Rogue: "d8", Warlock: "d8", Bard: "d8", Artificer: "d8", BloodHunter: "d10",
    Wizard: "d6", Sorcerer: "d6",
  };
  const primaryHitDie = classNames.length > 0
    ? classHitDie[classNames[0]] || "d8"
    : "d8";
  const hitDieNum = hitDieMap[primaryHitDie] || 8;
  const totalHd = character.level;
  const spentHd = (character as any).spentHitDice ?? 0;
  const remainingHd = Math.max(0, totalHd - spentHd);

  const hasAnything = isCaster || hasResources || remainingHd > 0;

  if (!hasAnything) {
    return (
      <div className="px-3 py-2 border-b border-white/[0.03]">
        <span className="text-[8px] uppercase tracking-wider text-surface-600 font-semibold">
          No Resources to Track
        </span>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 border-b border-white/[0.03] bg-white/[0.01] space-y-2 animate-in slide-in-from-bottom-1 duration-200">
      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <span className="text-[8px] uppercase tracking-wider text-gold-500/50 font-semibold">
          Resources
        </span>
        {isCaster && (
          <span className="text-[7px] px-1 py-0.5 rounded bg-gold-500/10 text-gold-500/60 font-mono">
            DC {spellcasting.spellSaveDC} · ATK +{spellcasting.spellAttackBonus}
          </span>
        )}
      </div>

      {/* ── Spell Slots Grid ── */}
      {slotLevels.length > 0 && (
        <div className="grid grid-cols-5 gap-1.5">
          {slotLevels.map((slot) => {
            const tier = slotTier(slot.current, slot.max);
            return (
              <div
                key={slot.level}
                className="relative flex flex-col items-center gap-0.5 p-1 rounded-lg bg-white/[0.02] border border-white/[0.03]"
              >
                {/* Level label */}
                <span className="text-[7px] font-mono uppercase text-surface-500">
                  Lv{slot.level}
                </span>
                {/* Gauge bar */}
                <div className="w-full h-1 bg-surface-800/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${tier.bar}`}
                    style={{ width: `${(slot.current / slot.max) * 100}%` }}
                  />
                </div>
                {/* Current/Max */}
                <span className={`text-[9px] font-mono tabular-nums font-bold ${tier.text}`}>
                  {slot.current}
                  <span className="text-surface-600 text-[7px]">/{slot.max}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Hit Dice + Class Resources Row ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Hit Dice pill */}
        {remainingHd > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.02] border border-white/[0.03]">
            <span className="text-[8px] font-mono tabular-nums text-surface-300">
              HD
            </span>
            <span className="text-[10px] font-mono tabular-nums font-bold text-gold-300">
              {remainingHd}
            </span>
            <span className="text-[8px] font-mono tabular-nums text-surface-600">
              {primaryHitDie}
            </span>
          </div>
        )}

        {/* Class resources */}
        {resources.map((res, idx) => {
          const maxR = res.max ?? 1;
          const curR = res.current ?? 0;
          const ratio = maxR > 0 ? curR / maxR : 0;
          return (
            <div
              key={res.name || idx}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.02] border border-white/[0.03]"
            >
              <span className="text-[7px] uppercase tracking-wider text-surface-500 max-w-[40px] truncate">
                {res.name}
              </span>
              <span className="text-[10px] font-mono tabular-nums font-bold text-gold-300">
                {curR}
                <span className="text-surface-600 text-[7px]">/{maxR}</span>
              </span>
              {/* Micro progress dot */}
              <div className="w-6 h-1 bg-surface-800/40 rounded-full overflow-hidden hidden sm:block">
                <div
                  className={`h-full rounded-full ${resourceColor(res.name)}`}
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
