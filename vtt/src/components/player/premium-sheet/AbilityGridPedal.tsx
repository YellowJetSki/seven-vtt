/* ══════════════════════════════════════════════════════════════
   Ability Score Grid — Pedal-Sheet Style
   Each ability in its own chunky bordered box with mod in big
   text, score below, and save inline. Matches the pedal-sheet's
   "press-able physical card" aesthetic.
   ══════════════════════════════════════════════════════════════ */
import type { PlayerCharacter, Ability } from "@/types";
import { mod, modStr, pb } from "./index";
import { getThemeForClass } from "./character-theme";

interface Props {
  character: PlayerCharacter;
}

const ABILITIES: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABIL_LABELS: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

export function AbilityGridPedal({ character }: Props) {
  const theme = getThemeForClass(character.classes?.[0]?.name || character.class || "");
  const prof = pb(character.level);

  return (
    <div className="grid grid-cols-6 gap-2">
      {ABILITIES.map((abil) => {
        const score = character[abil];
        const m = mod(score);
        const save = character.savingThrows?.[abil];
        const isProf = save?.proficient || false;
        const saveTotal = isProf ? m + prof : m;
        const isPositive = m >= 0;

        return (
          <div
            key={abil}
            className="relative bg-surface-900 border-[3px] border-surface-950 rounded-xl flex flex-col items-center justify-center p-2 shadow-[4px_4px_0px_rgba(15,16,22,0.8)] transition-all hover:-translate-y-0.5"
          >
            {/* Label */}
            <span className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1">
              {ABIL_LABELS[abil]}
            </span>

            {/* Modifier (big number) */}
            <div className="w-12 h-12 bg-surface-950 rounded-xl border-2 border-surface-800 shadow-inner flex items-center justify-center mb-1.5">
              <span
                className={`text-2xl font-black pedal-text-shadow ${
                  isPositive ? "text-rogue-400" : "text-warrior-400"
                }`}
              >
                {modStr(m)}
              </span>
            </div>

            {/* Score */}
            <span className="text-[9px] font-bold text-surface-400 mb-1">{score}</span>

            {/* Save Row */}
            <div className="w-full flex items-center justify-between bg-surface-950 px-1.5 py-1 rounded-lg shadow-inner border border-surface-800">
              <span className="text-[7px] font-black text-surface-600 uppercase tracking-widest">SV</span>
              <div className="flex items-center gap-1">
                {isProf && (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: theme.hexAccent, boxShadow: `0 0 4px ${theme.hexAccent}` }}
                  />
                )}
                <span
                  className={`text-[10px] font-black ${
                    isProf ? theme.accent : "text-surface-300"
                  }`}
                >
                  {saveTotal >= 0 ? "+" : ""}{saveTotal}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
