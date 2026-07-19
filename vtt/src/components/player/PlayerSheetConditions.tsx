import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter } from "@/types";

const ALL_CONDITIONS = [
  "Blinded", "Charmed", "Deafened", "Frightened", "Grappled",
  "Incapacitated", "Invisible", "Paralyzed", "Petrified",
  "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious",
];

interface PlayerSheetConditionsProps {
  character: PlayerCharacter;
}

export default function PlayerSheetConditions({ character }: PlayerSheetConditionsProps) {
  const c = character;
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  return (
    <div>
      <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-1.5">Conditions</span>
      <div className="flex flex-wrap gap-1.5">
        {ALL_CONDITIONS.map((cond) => {
          const isActive = c.conditions.includes(cond.toLowerCase());
          return (
            <button key={cond} onClick={() => {
              const updated = isActive
                ? c.conditions.filter((x) => x !== cond.toLowerCase())
                : [...c.conditions, cond.toLowerCase()];
              updateCharacter(c.id, { conditions: updated });
            }}
              className={`px-2.5 py-2 rounded-lg text-xs font-semibold active:scale-95 transition-all duration-150 border ${
                isActive
                  ? "bg-gold-500/10 border-gold/25 text-gold-400 shadow-[0_0_6px_rgba(234,179,8,0.06)]"
                  : "bg-obsidian-mid/40 border-surface-700/20 text-surface-400 hover:border-gold/15 hover:text-gold-500/50"
              }`}>
              {cond}
            </button>
          );
        })}
      </div>
    </div>
  );
}
