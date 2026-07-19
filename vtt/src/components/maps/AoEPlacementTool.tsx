/**
 * STᚱ VTT — AoE Placement Tool
 *
 * Panel for placing and managing spell area-of-effect templates on the canvas.
 * Supports circles, cones, lines, cubes, and spheres with 8 spell presets.
 */

import { useState } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { Plus } from "lucide-react";
import type { AoETemplate } from "@/types";
import AoEPresetSelector from "./AoEPresetSelector";
import AoETemplateList from "./AoETemplateList";

interface AoEPlacementToolProps {
  mapId: string;
  onPlace: (template: AoETemplate) => void;
}

export default function AoEPlacementTool({ mapId, onPlace }: AoEPlacementToolProps) {
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const removeAoETemplate = useCampaignStore((s) => s.removeAoETemplate);

  const currentMap = battleMaps.find((m) => m.id === mapId);
  const templates = currentMap?.aoeTemplates || [];
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-black text-surface-400">Spell Templates</span>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gold-500/10 border border-gold/25 text-gold-400 text-[10px] font-semibold active:scale-95 transition-all duration-200 hover:bg-gold-500/15">
          <Plus className="w-3 h-3" />
          <span>Add AoE</span>
        </button>
      </div>

      {showForm && currentMap && (
        <div className="rounded-xl bg-surface-800/40 border border-surface-700/20 p-3 space-y-2">
          <AoEPresetSelector
            gridWidth={currentMap.gridWidth}
            gridHeight={currentMap.gridHeight}
            onPlace={onPlace}
          />
        </div>
      )}

      <AoETemplateList templates={templates} mapId={mapId} onRemove={removeAoETemplate} />
    </div>
  );
}
