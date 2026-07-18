/* ══════════════════════════════════════════════════════════════
   Spellcasting — Pedal-Sheet Style
   Spellcasting ability, DC, spell attack bonus, and
   spell slot gauges per level (1–9).
   ══════════════════════════════════════════════════════════════ */
import type { PlayerCharacter, Ability } from "@/types";
import { mod, pb } from "./index";
import { getThemeForClass } from "./character-theme";

interface Props {
  character: PlayerCharacter;
}

function getSpellAbility(c: string): Ability {
  const cls = c.toLowerCase();
  if (cls === "wizard" || cls === "artificer") return "intelligence";
  if (cls === "cleric" || cls === "druid" || cls === "ranger" || cls === "paladin") return "wisdom";
  if (cls === "sorcerer" || cls === "bard" || cls === "warlock") return "charisma";
  return "intelligence";
}

const ABIL_LABELS: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

export function SpellcastingPedal({ character }: Props) {
  const className = character.classes?.[0]?.name || character.class || "";
  const spellStat = getSpellAbility(className);
  const spellScore = character[spellStat];
  const p = pb(character.level);
  const dc = 8 + p + mod(spellScore);
  const atk = p + mod(spellScore);

  const theme = getThemeForClass(className);

  // Extract spell slots from the character
  const slots = character.spellSlots || (character as any).spellcasting?.spellSlots || {};
  const slotEntries = Object.entries(slots)
    .map(([level, data]: [string, any]) => ({
      level: parseInt(level, 10),
      current: data.current ?? 0,
      max: data.max ?? 0,
    }))
    .filter((s) => s.max > 0)
    .sort((a, b) => a.level - b.level);

  if (slotEntries.length === 0) return null;

  return (
    <div className="pedal-card bg-surface-900 p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="pedal-label flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          Spellcasting
        </span>
        <div className="text-[10px] font-bold text-surface-500">
          {ABIL_LABELS[spellStat]}-based
        </div>
      </div>

      {/* DC + ATK */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="pedal-stat-block p-2 text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-surface-500 mb-0.5">Spell Save DC</p>
          <p className={`text-xl font-black ${theme.accent} pedal-text-shadow`}>{dc}</p>
        </div>
        <div className="pedal-stat-block p-2 text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-surface-500 mb-0.5">Spell Attack</p>
          <p className={`text-xl font-black ${theme.accent} pedal-text-shadow`}>+{atk}</p>
        </div>
      </div>

      {/* Spell Slots */}
      <div className="space-y-1.5">
        {slotEntries.map((slot) => {
          const pct = slot.max > 0 ? (slot.current / slot.max) * 100 : 0;
          return (
            <div key={slot.level} className="flex items-center gap-2">
              <span className="text-[9px] font-black text-surface-500 w-4 text-center uppercase">
                Lv{slot.level}
              </span>
              <div className="flex-1 pedal-hp-bar h-3 bg-surface-950 relative">
                <div
                  className="pedal-hp-fill"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${theme.hexAccent}, ${theme.hexAccent}88)`,
                    boxShadow: `0 0 6px ${theme.hexAccent}44`,
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white/70">
                  {slot.current}/{slot.max}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
