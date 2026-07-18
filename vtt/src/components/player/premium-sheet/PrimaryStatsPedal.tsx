/* ══════════════════════════════════════════════════════════════
   Primary Stats Row — Pedal-Sheet Style
   AC, Init, PB, Speed, Level, Hit Dice as chunky stat boxes
   with uppercase labels and press-animated feel.
   ══════════════════════════════════════════════════════════════ */
import type { PlayerCharacter } from "@/types";
import { modStr, mod, pb } from "./index";
import { getThemeForClass } from "./character-theme";

interface Props {
  character: PlayerCharacter;
}

export function PrimaryStatsPedal({ character }: Props) {
  const theme = getThemeForClass(character.classes?.[0]?.name || character.class || "");
  const prof = pb(character.level);

  const passivePerc = 10 + mod(character.wisdom) + (character.skills?.perception === "proficient" ? prof : 0);
  const passiveInv = 10 + mod(character.intelligence) + (character.skills?.investigation === "proficient" ? prof : 0);
  const passiveIns = 10 + mod(character.wisdom) + (character.skills?.insight === "proficient" ? prof : 0);

  const stats = [
    { label: "AC", value: String(character.armorClass), accent: "text-amber-400" },
    { label: "Init", value: modStr(character.initiative || character.dexterity), accent: "text-rogue-400" },
    { label: "Prof", value: `+${prof}`, accent: theme.accent },
    { label: "Speed", value: `${character.speed?.walk || 30}ft`, accent: "text-warrior-400" },
    { label: "Level", value: String(character.level), accent: "text-divine-400" },
    { label: "HD", value: character.hitDice || "—", accent: "text-surface-300" },
    { label: "PP", value: String(passivePerc), accent: "text-rogue-400" },
    { label: "PI", value: String(passiveInv), accent: "text-mage-400" },
    { label: "PIns", value: String(passiveIns), accent: "text-divine-400" },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="pedal-stat-block p-2 text-center transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(15,16,22,0.6)]"
        >
          <p className="text-[8px] font-black uppercase tracking-widest text-surface-500 mb-0.5">
            {stat.label}
          </p>
          <p className={`text-base font-black ${stat.accent} pedal-text-shadow`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
