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
      <span className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1.5">Conditions</span>
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
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all duration-150 border ${
                isActive ? "bg-accent-600/20 border-accent-500/30 text-accent-300" : "bg-surface-800/30 border-surface-700/20 text-surface-400 hover:bg-surface-700/40"
              }`}>
              {cond}
            </button>
          );
        })}
      </div>
    </div>
  );
}
