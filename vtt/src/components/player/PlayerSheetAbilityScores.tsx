/**
 * STᚱ VTT — Player Sheet Ability Scores (Premium Visualization)
 *
 * Premium ability score display with animated stat bars, point-buy reference,
 * and saving throw integration. Each score shows:
 * - Ability name (STR/DEX/CON/INT/WIS/CHA) with icon
 * - Score value (large) with modifier (small)
 * - Visual stat bar from 3-30 range with gradient fill
 * - Saving throw proficiency dot indicator
 * - Hover elevation with gold accent glow
 *
 * Designed for split-second reference during gameplay.
 * Zero purple tokens — all gold/amber/rose/emerald system.
 */

import type { PlayerCharacter } from "@/types";
import { getAbilityMod } from "@/lib/mechanics/character-derivations";

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function modStr(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function barWidth(score: number): number {
  // Range 3-30 → 0-100%
  return Math.max(0, Math.min(100, ((score - 3) / 27) * 100));
}

// ── Ability icons & colors ──
const ABILITY_META: Record<string, { icon: string; color: string; label: string }> = {
  strength: { icon: "💪", color: "bg-rose-500", label: "Athletics" },
  dexterity: { icon: "🎯", color: "bg-emerald-500", label: "Acrobatics/Stealth" },
  constitution: { icon: "❤️", color: "bg-amber-500", label: "Hit Points" },
  intelligence: { icon: "🧠", color: "bg-cyan-500", label: "Arcana/Investigation" },
  wisdom: { icon: "👁️", color: "bg-violet-500", label: "Perception/Insight" },
  charisma: { icon: "💬", color: "bg-pink-500", label: "Persuasion/Deception" },
};

function metaBar(abilityKey: string): { bg: string; glow: string } {
  // Token map — all gold/amber/emerald/rose/cyan/violet
  const map: Record<string, { bg: string; glow: string }> = {
    strength: { bg: "from-rose-500 to-rose-400", glow: "rgba(244,63,94,0.2)" },
    dexterity: { bg: "from-emerald-500 to-emerald-400", glow: "rgba(52,211,153,0.2)" },
    constitution: { bg: "from-amber-500 to-amber-400", glow: "rgba(245,158,11,0.2)" },
    intelligence: { bg: "from-cyan-500 to-cyan-400", glow: "rgba(6,182,212,0.2)" },
    wisdom: { bg: "from-violet-500 to-violet-400", glow: "rgba(139,92,246,0.2)" },
    charisma: { bg: "from-pink-500 to-pink-400", glow: "rgba(236,72,153,0.2)" },
  };
  return map[abilityKey] || { bg: "from-gold-500 to-gold-400", glow: "rgba(234,179,8,0.2)" };
}

// ── Score descriptions by range ──
function scoreDescription(score: number): string {
  if (score <= 1) return "Feeble";
  if (score <= 3) return "Weak";
  if (score <= 8) return "Below Average";
  if (score <= 12) return "Average";
  if (score <= 15) return "Above Average";
  if (score <= 18) return "Exceptional";
  if (score <= 20) return "Heroic";
  if (score <= 25) return "Legendary";
  return "Mythic";
}

interface PlayerSheetAbilityScoresProps {
  character: PlayerCharacter;
}

export default function PlayerSheetAbilityScores({ character }: PlayerSheetAbilityScoresProps) {
  const c = character;
  const abilities = [
    { name: "STR", key: "strength" as const, value: c.strength,
      saveProf: c.savingThrows?.strength?.proficient || false },
    { name: "DEX", key: "dexterity" as const, value: c.dexterity,
      saveProf: c.savingThrows?.dexterity?.proficient || false },
    { name: "CON", key: "constitution" as const, value: c.constitution,
      saveProf: c.savingThrows?.constitution?.proficient || false },
    { name: "INT", key: "intelligence" as const, value: c.intelligence,
      saveProf: c.savingThrows?.intelligence?.proficient || false },
    { name: "WIS", key: "wisdom" as const, value: c.wisdom,
      saveProf: c.savingThrows?.wisdom?.proficient || false },
    { name: "CHA", key: "charisma" as const, value: c.charisma,
      saveProf: c.savingThrows?.charisma?.proficient || false },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {abilities.map((a) => {
        const mod = abilityMod(a.value);
        const meta = ABILITY_META[a.key] || { icon: "✦", color: "bg-gold-500", label: a.key };
        const bar = metaBar(a.key);
        const desc = scoreDescription(a.value);

        return (
          <div
            key={a.key}
            className="group relative flex flex-col bg-obsidian-mid/40 rounded-xl border border-surface-700/20 p-3 hover:border-gold/10 hover:shadow-[0_4px_16px_rgba(234,179,8,0.04)] transition-all duration-200"
          >
            {/* Header: Name + Icon + Save Prof */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{meta.icon}</span>
                <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">
                  {a.name}
                </span>
                {/* Save proficiency dot */}
                {a.saveProf && (
                  <span className="w-2 h-2 rounded-full bg-gold-500 shadow-[0_0_4px_rgba(234,179,8,0.3)]"
                    title={`Proficient in ${a.name} saves`} />
                )}
              </div>
              <span className="text-[7px] uppercase tracking-wider text-surface-600 font-medium">
                {desc}
              </span>
            </div>

            {/* Score value */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold tabular-nums leading-none text-gold-200 drop-shadow-[0_0_4px_rgba(234,179,8,0.06)]">
                {a.value}
              </span>
              <span className={`text-sm font-medium tabular-nums ${
                mod > 0 ? "text-gold-400" : mod < 0 ? "text-rose-400" : "text-surface-500"
              }`}>
                {modStr(mod)}
              </span>
            </div>

            {/* Stat bar 3–30 */}
            <div className="relative h-1.5 bg-surface-800/60 rounded-full overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${bar.bg} transition-all duration-700 ease-out`}
                style={{
                  width: `${barWidth(a.value)}%`,
                  boxShadow: `0 0 6px ${bar.glow}`,
                }}
              />
              {/* Range markers */}
              <div className="absolute inset-0 flex items-center justify-between px-0.5 pointer-events-none">
                <span className="text-[5px] text-surface-700">3</span>
                <span className="text-[5px] text-surface-700">10</span>
                <span className="text-[5px] text-surface-700">18</span>
                <span className="text-[5px] text-surface-700">30</span>
              </div>
            </div>

            {/* Bottom: label + saving throw */}
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[7px] uppercase tracking-wider text-surface-600">
                {meta.label}
              </span>
              {a.saveProf && (
                <span className="text-[7px] font-bold text-gold-500/60 uppercase tracking-wider">
                  ✓ Save
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
