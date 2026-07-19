import { useState, useCallback } from "react";
import type { AoETemplate, AoE_Shape } from "@/types";

interface PresetSpell {
  name: string;
  shape: AoE_Shape;
  size: number;
  color: string;
  damageType?: string;
}

export const PRESET_SPELLS: PresetSpell[] = [
  { name: "Fireball", shape: "sphere", size: 20, color: "#FF6B35", damageType: "Fire" },
  { name: "Burning Hands", shape: "cone", size: 15, color: "#FF4500", damageType: "Fire" },
  { name: "Lightning Bolt", shape: "line", size: 100, color: "#FFD700", damageType: "Lightning" },
  { name: "Cone of Cold", shape: "cone", size: 60, color: "#00BFFF", damageType: "Cold" },
  { name: "Bless", shape: "circle", size: 30, color: "#FFD700" },
  { name: "Spirit Guardians", shape: "circle", size: 15, color: "#8B5CF6", damageType: "Radiant" },
  { name: "Moonbeam", shape: "circle", size: 5, color: "#C8D8FF", damageType: "Radiant" },
  { name: "Hypnotic Pattern", shape: "cube", size: 30, color: "#FF69B4" },
];

function generateAoEId(): string {
  return `aoe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

interface AoEPresetSelectorProps {
  gridWidth: number;
  gridHeight: number;
  onPlace: (template: AoETemplate) => void;
}

export default function AoEPresetSelector({ gridWidth, gridHeight, onPlace }: AoEPresetSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const applyPreset = useCallback(() => {
    const preset = PRESET_SPELLS.find((p) => p.name === selectedPreset);
    if (!preset) return;

    const template: AoETemplate = {
      id: generateAoEId(),
      label: preset.name,
      shape: preset.shape,
      size: preset.size,
      gridX: Math.floor(gridWidth / 2),
      gridY: Math.floor(gridHeight / 2),
      direction: "n",
      color: preset.color,
      opacity: 0.3,
      savingThrowDC: 15,
      savingThrowAbility: "dexterity",
      damageDice: "8d6",
      damageType: preset.damageType,
      visibleToPlayers: true,
    };

    onPlace(template);
    setSelectedPreset("");
  }, [selectedPreset, gridWidth, gridHeight, onPlace]);

  return (
    <div className="space-y-2">
      <span className="text-[10px] uppercase tracking-widest font-black text-surface-400">Spell Presets</span>
      <div className="flex flex-wrap gap-1">
        {PRESET_SPELLS.map((spell) => (
          <button
            key={spell.name}
            onClick={() => setSelectedPreset(spell.name)}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
              selectedPreset === spell.name
                ? "bg-accent-600/20 border-accent-500/30 text-accent-300"
                : "bg-surface-800/30 border-surface-700/20 text-surface-400 hover:bg-surface-700/40"
            }`}
          >
            {spell.name}
          </button>
        ))}
      </div>
      {selectedPreset && (
        <button onClick={applyPreset}
          className="w-full py-2 rounded-lg bg-accent-600/20 border border-accent-500/20 text-accent-300 text-xs font-semibold active:scale-95 transition-all">
          ✦ Place {selectedPreset}
        </button>
      )}
    </div>
  );
}
