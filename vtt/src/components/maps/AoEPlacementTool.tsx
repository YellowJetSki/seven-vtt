/**
 * STᚱ VTT — AoE Placement Tool
 *
 * Panel for placing and managing spell area-of-effect templates on the canvas.
 * Supports circles, cones, lines, cubes, and spheres with configurable size,
 * direction, color, and damage/difficulty details.
 *
 * Integration: Used within DmControlCenter as a placement mode.
 */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { Plus, Trash2, Move, Eye, EyeOff } from "lucide-react";
import type { AoETemplate, AoE_Shape, AoE_Direction, AoE_OriginAnchor } from "@/types";

interface AoEPlacementToolProps {
  mapId: string;
  onPlace: (template: AoETemplate) => void;
}

const SHAPES: AoE_Shape[] = ["circle", "cone", "line", "cube", "sphere"];
const DIRECTIONS: AoE_Direction[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

const PRESET_SPELLS: { name: string; shape: AoE_Shape; size: number; color: string; damageType?: string }[] = [
  { name: "Fireball", shape: "sphere", size: 20, color: "#FF6B35", damageType: "Fire" },
  { name: "Burning Hands", shape: "cone", size: 15, color: "#FF4500", damageType: "Fire" },
  { name: "Lightning Bolt", shape: "line", size: 100, color: "#FFD700", damageType: "Lightning" },
  { name: "Cone of Cold", shape: "cone", size: 60, color: "#00BFFF", damageType: "Cold" },
  { name: "Bless", shape: "circle", size: 30, color: "#FFD700", damageType: undefined },
  { name: "Spirit Guardians", shape: "circle", size: 15, color: "#8B5CF6", damageType: "Radiant" },
  { name: "Moonbeam", shape: "circle", size: 5, color: "#C8D8FF", damageType: "Radiant" },
  { name: "Hypnotic Pattern", shape: "cube", size: 30, color: "#FF69B4", damageType: undefined },
];

function generateAoEId(): string {
  return `aoe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export default function AoEPlacementTool({ mapId, onPlace }: AoEPlacementToolProps) {
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const updateAoETemplate = useCampaignStore((s) => s.updateAoETemplate);
  const removeAoETemplate = useCampaignStore((s) => s.removeAoETemplate);

  const currentMap = battleMaps.find((m) => m.id === mapId);
  const templates = currentMap?.aoeTemplates || [];

  const [showForm, setShowForm] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const newTemplate: Omit<AoETemplate, "id"> = {
    label: "New AoE",
    shape: "circle",
    size: 20,
    gridX: 5,
    gridY: 5,
    direction: "n",
    color: "#FF6B35",
    opacity: 0.3,
    visibleToPlayers: true,
  };

  // ── Apply preset ──
  const applyPreset = useCallback(() => {
    const preset = PRESET_SPELLS.find((p) => p.name === selectedPreset);
    if (!preset) return;

    const template: AoETemplate = {
      id: generateAoEId(),
      label: preset.name,
      shape: preset.shape,
      size: preset.size,
      gridX: Math.floor((currentMap?.gridWidth || 20) / 2),
      gridY: Math.floor((currentMap?.gridHeight || 15) / 2),
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
  }, [selectedPreset, currentMap, onPlace]);

  // ── Custom placement ──
  const handleCustomPlace = useCallback(() => {
    const template: AoETemplate = {
      id: generateAoEId(),
      ...newTemplate,
      gridX: Math.floor((currentMap?.gridWidth || 20) / 2),
      gridY: Math.floor((currentMap?.gridHeight || 15) / 2),
    };
    onPlace(template);
    setShowForm(false);
  }, [currentMap, newTemplate, onPlace]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-black text-surface-400">Spell Templates</span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-600/15 border border-accent-500/20 text-accent-300 text-[10px] font-semibold active:scale-95 transition-all"
        >
          <Plus className="w-3 h-3" />
          <span>Add AoE</span>
        </button>
      </div>

      {/* Preset selector */}
      {showForm && (
        <div className="rounded-xl bg-surface-800/40 border border-surface-700/20 p-3 space-y-2">
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
            <button
              onClick={applyPreset}
              className="w-full py-2 rounded-lg bg-accent-600/20 border border-accent-500/20 text-accent-300 text-xs font-semibold active:scale-95 transition-all"
            >
              ✦ Place {selectedPreset}
            </button>
          )}
        </div>
      )}

      {/* Active templates list */}
      {templates.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-surface-500 text-[10px]">No spell templates placed</p>
        </div>
      ) : (
        <div className="space-y-1">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-surface-800/30 border border-surface-700/20"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: tpl.color }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-surface-300 truncate block">{tpl.label}</span>
                <span className="text-[9px] text-surface-500">
                  {tpl.shape} · {tpl.size}ft · {tpl.direction.toUpperCase()}
                  {tpl.damageType && ` · ${tpl.damageType}`}
                </span>
              </div>
              <button
                onClick={() => removeAoETemplate(mapId, tpl.id)}
                className="p-1 rounded hover:bg-red-500/15 text-surface-400 hover:text-red-400 transition-all active:scale-90"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
