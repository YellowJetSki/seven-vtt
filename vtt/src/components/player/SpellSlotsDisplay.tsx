/* ── SpellSlotsDisplay ─────────────────────────────────────────
 * Displays available spell slot pips for caster classes.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter } from "@/types";

const CASTER_CLASSES = ["bard", "cleric", "druid", "sorcerer", "warlock", "wizard", "paladin", "ranger", "artificer"];

function isCaster(char: PlayerCharacter): boolean {
  const clsLower = (char.class ?? "").toLowerCase();
  if (CASTER_CLASSES.some(c => clsLower.includes(c))) return true;
  if (char.classes?.some(c => CASTER_CLASSES.some(cc => c.name.toLowerCase().includes(cc)))) return true;
  return false;
}

interface Props {
  character: PlayerCharacter;
}

export function SpellSlotsDisplay({ character }: Props) {
  if (!isCaster(character)) {
    return (
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">📖 Spell Slots</h2>
        <p className="text-xs text-surface-500">No spell slots needed for this class.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">📖 Spell Slots</h2>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, Math.min(9, Math.ceil((character.level ?? 1) / 2) + 1)).map((lvl) => {
          const totalSlots = (character as any).spellSlots?.[lvl] ?? 0;
          const usedSlots = (character as any).spellSlots?.[`used${lvl}`] ?? 0;
          if (totalSlots === 0 && lvl > 2) return null;
          return (
            <div key={lvl} className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-1.5">
              <span className="text-xs text-surface-400">Level {lvl}</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalSlots }, (_, i) => (
                  <span key={i} className={`h-3 w-3 rounded-full ${i < usedSlots ? 'bg-surface-600' : 'bg-accent-500'}`} />
                ))}
                {totalSlots === 0 && <span className="text-xs text-surface-600">—</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
