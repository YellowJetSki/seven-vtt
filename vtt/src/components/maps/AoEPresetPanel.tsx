/* ── AoEPresetPanel ────────────────────────────────────────────
 * Sidebar panel for the MapEditor that displays AOE spell
 * presets as a quick-access grid, plus a list of placed
 * templates with controls for removal and visibility.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import type { AoETemplate, AoE_Shape, AoE_Direction } from "@/types/aoe-templates";
import { AOE_PRESETS } from "@/types/aoe-templates";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Props {
  templates: AoETemplate[];
  onAddTemplate: (template: AoETemplate) => void;
  onRemoveTemplate: (id: string) => void;
  onUpdateTemplate: (id: string, updates: Partial<AoETemplate>) => void;
}

/** Color-coded shape icon */
function ShapeIcon({ shape }: { shape: AoE_Shape }) {
  const icons: Record<AoE_Shape, string> = {
    circle: "◎",
    cone: "△",
    line: "▬",
    cube: "▣",
    sphere: "◉",
  };
  return <span className="text-sm">{icons[shape]}</span>;
}

/** Map shape to direction options */
function getDirectionsForShape(shape: AoE_Shape): AoE_Direction[] {
  if (shape === "circle" || shape === "sphere" || shape === "cube") {
    return []; // omnidirectional — no direction needed
  }
  return ["north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest"];
}

export function AoEPresetPanel({ templates, onAddTemplate, onRemoveTemplate, onUpdateTemplate }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [previewDirection, setPreviewDirection] = useState<AoE_Direction>("east");

  /** Filter presets by search term */
  const filteredPresets = useMemo(
    () => AOE_PRESETS.filter((p) =>
      p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.shape.includes(searchTerm.toLowerCase()),
    ),
    [searchTerm],
  );

  /** Place a template from a preset at the origin (0,0) — DM repositions by clicking the map */
  const handleSelectPreset = (presetId: string) => {
    const preset = AOE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const direction = getDirectionsForShape(preset.shape).length > 0
      ? previewDirection
      : ("east" as AoE_Direction);

    const template: AoETemplate = {
      id: `aoe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: preset.label,
      shape: preset.shape,
      size: preset.size,
      gridX: 3, // Default position — DM drags to correct spot
      gridY: 3,
      direction,
      color: preset.color,
      opacity: 0.25,
      damageDice: preset.damageDice,
      damageType: preset.damageType,
      visibleToPlayers: false,
      animation: "none",
      notes: preset.description,
      createdAt: Date.now(),
    };

    onAddTemplate(template);
    setSelectedPresetId(presetId);
  };

  /** Duplicate an existing template */
  const handleDuplicate = (tpl: AoETemplate) => {
    const duplicate: AoETemplate = {
      ...tpl,
      id: `aoe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: `${tpl.label} (copy)`,
      gridX: tpl.gridX + 2,
      gridY: tpl.gridY + 2,
      createdAt: Date.now(),
    };
    onAddTemplate(duplicate);
  };

  const placedCount = templates.length;

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-700 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">✦</span>
          <span className="text-xs font-semibold text-surface-200">Spell Templates</span>
        </div>
        {placedCount > 0 && (
          <Badge variant="accent" size="sm">{placedCount}</Badge>
        )}
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-surface-700">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search presets..."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-2.5 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
        />
      </div>

      {/* Direction selector (shown when a directional template is selected) */}
      {selectedPresetId && (() => {
        const preset = AOE_PRESETS.find((p) => p.id === selectedPresetId);
        if (!preset) return null;
        const dirs = getDirectionsForShape(preset.shape);
        if (dirs.length === 0) return null;

        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-surface-700 bg-surface-800/50">
            <span className="text-[9px] text-surface-500 shrink-0">Dir:</span>
            <div className="flex flex-wrap gap-1">
              {dirs.map((dir) => (
                <button
                  key={dir}
                  onClick={() => setPreviewDirection(dir)}
                  className={`rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
                    previewDirection === dir
                      ? "bg-accent-600 text-white"
                      : "bg-surface-800 text-surface-400 hover:bg-surface-700"
                  }`}
                >
                  {dir === "north" ? "↑" : dir === "south" ? "↓" : dir === "east" ? "→" : dir === "west" ? "←" :
                   dir === "northeast" ? "↗" : dir === "northwest" ? "↖" : dir === "southeast" ? "↘" : "↙"}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Preset grid */}
      <div className="max-h-80 overflow-y-auto p-2 space-y-1">
        {filteredPresets.length === 0 ? (
          <p className="py-4 text-center text-[10px] text-surface-500">No presets match &ldquo;{searchTerm}&rdquo;</p>
        ) : (
          filteredPresets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            const isPlaced = templates.some((t) => t.label === preset.label);
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all ${
                  isSelected
                    ? "bg-accent-600/15 border border-accent-500/30"
                    : "bg-surface-800/50 border border-transparent hover:bg-surface-800 hover:border-surface-600"
                }`}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-md shrink-0"
                  style={{ backgroundColor: `${preset.color}20` }}
                >
                  <ShapeIcon shape={preset.shape} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-surface-200 truncate">{preset.label}</span>
                    {isPlaced && <span className="text-[8px] text-accent-400 shrink-0">✓</span>}
                  </div>
                  <p className="text-[9px] text-surface-500 truncate">{preset.description}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span
                    className="text-[8px] font-mono font-medium rounded px-1"
                    style={{ backgroundColor: `${preset.color}20`, color: preset.color }}
                  >
                    {preset.size}ft
                  </span>
                  {preset.damageDice && (
                    <span className="text-[8px] text-surface-500">{preset.damageDice}</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Placed templates list */}
      {templates.length > 0 && (
        <div className="border-t border-surface-700">
          <div className="px-3 py-1.5 bg-surface-800/30">
            <span className="text-[9px] font-medium text-surface-500 uppercase tracking-wider">
              Placed Templates ({placedCount})
            </span>
          </div>
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="flex items-center gap-2 rounded-lg bg-surface-800/50 px-2.5 py-2 border border-transparent hover:border-surface-600 transition-all group"
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded shrink-0"
                  style={{ backgroundColor: `${tpl.color ?? "#aa66ff"}20` }}
                >
                  <span className="text-[10px]"><ShapeIcon shape={tpl.shape} /></span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-medium text-surface-200 truncate">{tpl.label}</span>
                    <span className="text-[8px] text-surface-500">({tpl.gridX},{tpl.gridY})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-surface-500">{tpl.size}ft {tpl.shape}</span>
                    {tpl.damageDice && (
                      <span className="text-[8px] text-surface-500">{tpl.damageDice}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {/* Visibility toggle */}
                  <button
                    onClick={() => onUpdateTemplate(tpl.id, { visibleToPlayers: !tpl.visibleToPlayers })}
                    className={`rounded p-1 text-[10px] transition-colors ${
                      tpl.visibleToPlayers
                        ? "text-accent-400 hover:text-accent-300"
                        : "text-surface-500 hover:text-surface-400"
                    }`}
                    title={tpl.visibleToPlayers ? "Visible to players" : "DM-only"}
                  >
                    {tpl.visibleToPlayers ? "👁" : "🙈"}
                  </button>

                  {/* Animation toggle */}
                  <button
                    onClick={() => {
                      const animOrder: AoETemplate["animation"][] = ["none", "pulse", "shimmer", "burn"];
                      const idx = animOrder.indexOf(tpl.animation ?? "none");
                      const next = animOrder[(idx + 1) % animOrder.length];
                      onUpdateTemplate(tpl.id, { animation: next });
                    }}
                    className="rounded p-1 text-[10px] text-surface-500 hover:text-surface-400 transition-colors"
                    title={`Animation: ${tpl.animation ?? "none"}`}
                  >
                    {tpl.animation === "none" ? "◌" : tpl.animation === "pulse" ? "◉" : tpl.animation === "shimmer" ? "✨" : "🔥"}
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={() => handleDuplicate(tpl)}
                    className="rounded p-1 text-[10px] text-surface-500 hover:text-surface-400 transition-colors"
                    title="Duplicate"
                  >
                    📋
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onRemoveTemplate(tpl.id)}
                    className="rounded p-1 text-[10px] text-warrior-400 hover:text-warrior-300 transition-colors"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {templates.length === 0 && (
        <div className="px-3 py-6 text-center">
          <p className="text-[10px] text-surface-500">Click a preset above to place a spell template on the map.</p>
          <p className="mt-1 text-[8px] text-surface-600">Drag templates by clicking the map after placement.</p>
        </div>
      )}
    </div>
  );
}
