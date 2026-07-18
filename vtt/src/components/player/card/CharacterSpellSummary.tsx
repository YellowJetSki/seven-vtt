/* ── CharacterSpellSummary ─────────────────────────────────────
 * Compact spellcasting display: ability, DC, attack bonus, and
 * spell slot usage bars for each spell level.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter, Ability } from "@/types";

const ABBR: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

interface Props {
  character: PlayerCharacter;
}

export function CharacterSpellSummary({ character }: Props) {
  const sc = character.spellcasting;
  if (!sc) return null;

  const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
  const hasSlots = levels.some((lvl) => {
    const slots = (sc.spellSlots as Record<string, { max: number; used: number }>)[`level${lvl}`];
    return slots && slots.max > 0;
  });

  return (
    <div className="space-y-1">
      <p className="text-[8px] font-semibold uppercase tracking-wider text-surface-500 flex items-center gap-1">
        <span>🔮 Spellcasting</span>
        <span className="text-mage-400 font-mono text-[9px]">{ABBR[sc.spellcastingAbility]}</span>
        <span className="text-surface-500">·</span>
        <span className="text-mage-400 font-mono text-[9px]">DC {sc.spellSaveDC}</span>
        <span className="text-surface-500">·</span>
        <span className="text-accent-400 font-mono text-[9px]">+{sc.spellAttackBonus}</span>
      </p>

      {hasSlots && (
        <div className="flex flex-wrap gap-1">
          {levels.map((lvl) => {
            const slots = (sc.spellSlots as Record<string, { max: number; used: number }>)[`level${lvl}`];
            if (!slots || slots.max === 0) return null;
            const used = slots.used ?? 0;
            const remaining = slots.max - used;
            const pct = slots.max > 0 ? (used / slots.max) * 100 : 0;
            return (
              <div key={lvl} className="flex items-center gap-1 rounded bg-mage-500/10 px-1.5 py-0.5">
                <span className="text-[9px] font-mono font-bold text-mage-400">{lvl}</span>
                <div className="w-6 h-1 rounded-full bg-surface-700 overflow-hidden">
                  <div className="h-full rounded-full bg-mage-500 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <span className={`text-[8px] font-mono ${remaining > 0 ? "text-surface-300" : "text-warrior-400"}`}>
                  {remaining}/{slots.max}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
