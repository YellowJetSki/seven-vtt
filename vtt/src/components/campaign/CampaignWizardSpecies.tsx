/* ── CampaignWizardSpecies ─────────────────────────────────────
 * Step 3: Species selection (toggle 9 D&D races + custom).
 * ─────────────────────────────────────────────────────────────── */

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface SpeciesOption {
  id: string;
  label: string;
  isHomebrew?: boolean;
}

interface CampaignWizardSpeciesProps {
  selectedRaces: Set<string>;
  customRaces: SpeciesOption[];
  onToggleRace: (id: string) => void;
  onAddCustomRace: (label: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const DEFAULT_RACES: SpeciesOption[] = [
  { id: "dragonborn", label: "Dragonborn" },
  { id: "dwarf", label: "Dwarf" },
  { id: "elf", label: "Elf" },
  { id: "gnome", label: "Gnome" },
  { id: "half-elf", label: "Half-Elf" },
  { id: "half-orc", label: "Half-Orc" },
  { id: "halfling", label: "Halfling" },
  { id: "human", label: "Human" },
  { id: "tiefling", label: "Tiefling" },
];

export function CampaignWizardSpecies({
  selectedRaces, customRaces,
  onToggleRace, onAddCustomRace,
  onBack, onNext,
}: CampaignWizardSpeciesProps) {
  const [newRaceName, setNewRaceName] = useState("");

  const handleAdd = () => {
    const trimmed = newRaceName.trim();
    if (!trimmed) return;
    onAddCustomRace(trimmed);
    setNewRaceName("");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-surface-100">Allowed Species</h3>
      <p className="text-sm text-surface-400">Select which species players can choose from:</p>
      <div className="flex flex-wrap gap-2">
        {DEFAULT_RACES.map((race) => (
          <button
            key={race.id}
            onClick={() => onToggleRace(race.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              selectedRaces.has(race.id)
                ? "bg-accent-500/20 text-accent-300 ring-1 ring-accent-500"
                : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-300"
            }`}
          >
            {race.label}
          </button>
        ))}
        {customRaces.map((race) => (
          <button
            key={race.id}
            onClick={() => onToggleRace(race.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              selectedRaces.has(race.id)
                ? "bg-mage-500/20 text-mage-300 ring-1 ring-mage-500"
                : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-300"
            }`}
          >
            ✦ {race.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={newRaceName}
          onChange={(e) => setNewRaceName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add custom species..."
          className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
        />
        <Button size="xs" onClick={handleAdd} disabled={!newRaceName.trim()}>+ Add</Button>
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        <Button size="sm" onClick={onNext}>Next: Classes & Currency →</Button>
      </div>
    </div>
  );
}
