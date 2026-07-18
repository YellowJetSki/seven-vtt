/* ── AoEPresetPanel ────────────────────────────────────────────
 * Sidebar panel for the MapEditor that displays AOE spell
 * presets as a quick-access grid, plus a list of placed
 * templates with controls for removal and visibility.
 * Styled with arcane glassmorphism and fantasy aesthetic.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import type { AoETemplate, AoE_Shape, AoE_Direction } from "@/types/aoe-templates";
import { AOE_PRESETS } from "@/types/aoe-templates";
import { Badge } from "@/components/ui/Badge";

interface Props {
  templates: AoETemplate[];
  onAddTemplate: (template: AoETemplate) => void;
  onRemoveTemplate: (id: string) => void;
  onUpdateTemplate: (id: string, updates: Partial<AoETemplate>) => void;
}

/** Damage-type color mapping for element badges */
const DAMAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  fire: { bg: "rgba(255,68,0,0.15)", text: "#ff6633", border: "rgba(255,68,0,0.3)" },
  cold: { bg: "rgba(136,221,255,0.12)", text: "#88ddff", border: "rgba(136,221,255,0.25)" },
  lightning: { bg: "rgba(255,221,0,0.12)", text: "#ffdd00", border: "rgba(255,221,0,0.25)" },
  poison: { bg: "rgba(68,204,68,0.12)", text: "#44cc44", border: "rgba(68,204,68,0.25)" },
  radiant: { bg: "rgba(238,238,255,0.1)", text: "#eeeeff", border: "rgba(238,238,255,0.2)" },
  thunder: { bg: "rgba(170,136,255,0.12)", text: "#aa88ff", border: "rgba(170,136,255,0.25)" },
};

function getDamageColor(dt?: string) {
  if (!dt) return { bg: "transparent", text: "#888", border: "transparent" };
  return DAMAGE_COLORS[dt] ?? { bg: "rgba(255,255,255,0.05)", text: "#aaa", border: "rgba(255,255,255,0.1)" };
}

/** Shape icon with color variation */
function ShapeIcon({ shape }: { shape: AoE_Shape }) {
  const icons: Record<AoE_Shape, string> = {
    circle: "◎", cone: "△", line: "▬", cube: "▣", sphere: "◉",
  };
  return <span className="text-sm">{icons[shape]}</span>;
}

/** Is this shape directional? */
function isDirectional(shape: AoE_Shape): boolean {
  return shape !== "circle" && shape !== "sphere" && shape !== "cube";
}

/** Get direction options for a shape */
function getDirections(shape: AoE_Shape): AoE_Direction[] {
  if (!isDirectional(shape)) return [];
  return ["north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest"];
}

/** Arrow character for direction */
function dirArrow(dir: AoE_Direction): string {
  const arrows: Record<AoE_Direction, string> = {
    north: "↑", south: "↓", east: "→", west: "←",
    northeast: "↗", northwest: "↖", southeast: "↘", southwest: "↙",
  };
  return arrows[dir];
}

/** Damage type icon */
function damageIcon(dt?: string): string {
  const icons: Record<string, string> = {
    fire: "🔥", cold: "❄️", lightning: "⚡", poison: "☠️",
    radiant: "✨", thunder: "💥",
  };
  return dt ? (icons[dt] ?? "🎯") : "🎯";
}

export function AoEPresetPanel({ templates, onAddTemplate, onRemoveTemplate, onUpdateTemplate }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [previewDirection, setPreviewDirection] = useState<AoE_Direction>("east");

  const filteredPresets = useMemo(
    () => AOE_PRESETS.filter((p) =>
      p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.shape.includes(searchTerm.toLowerCase()),
    ),
    [searchTerm],
  );

  const handleSelectPreset = (presetId: string) => {
    const preset = AOE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const direction = isDirectional(preset.shape) ? previewDirection : ("east" as AoE_Direction);

    const template: AoETemplate = {
      id: `aoe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: preset.label,
      shape: preset.shape,
      size: preset.size,
      gridX: 3,
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

  const handleDuplicate = (tpl: AoETemplate) => {
    onAddTemplate({
      ...tpl,
      id: `aoe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: `${tpl.label} (copy)`,
      gridX: tpl.gridX + 2,
      gridY: tpl.gridY + 2,
      createdAt: Date.now(),
    });
  };

  const placedCount = templates.length;

  return (
    <div className="aoe-preset-panel rounded-xl border border-surface-700/60 bg-surface-850/80 backdrop-blur-md overflow-hidden shadow-lg">
      {/* Header with arcane styling */}
      <div className="flex items-center justify-between border-b border-surface-700/50 px-3.5 py-2.5 bg-gradient-to-r from-accent-900/10 to-transparent">
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ filter: "drop-shadow(0 0 6px rgba(139,48,255,0.4))" }}>✦</span>
          <span className="text-xs font-semibold text-surface-200 tracking-wide">Spell Templates</span>
        </div>
        {placedCount > 0 && (
          <Badge variant="accent" size="sm">{placedCount}</Badge>
        )}
      </div>

      {/* Search */}
      <div className="px-3.5 py-2.5 border-b border-surface-700/40">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500 text-[10px]">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search presets..."
            className="w-full rounded-lg border border-surface-700/50 bg-surface-800/60 pl-7 pr-2.5 py-1.5 text-xs text-surface-100 placeholder:text-surface-500/70 focus:border-accent-500/50 focus:outline-none focus:bg-surface-800/80 transition-all"
          />
        </div>
      </div>

      {/* Direction selector */}
      {selectedPresetId && (() => {
        const preset = AOE_PRESETS.find((p) => p.id === selectedPresetId);
        if (!preset || !isDirectional(preset.shape)) return null;
        const dirs = getDirections(preset.shape);

        return (
          <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-surface-700/30 bg-surface-800/40">
            <span className="text-[9px] text-surface-500 uppercase tracking-wider shrink-0">Aim</span>
            <div className="flex flex-wrap gap-1">
              {dirs.map((dir) => (
                <button
                  key={dir}
                  onClick={() => setPreviewDirection(dir)}
                  className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold transition-all ${
                    previewDirection === dir
                      ? "bg-accent-600 text-white shadow-sm"
                      : "bg-surface-800/60 text-surface-400 hover:bg-surface-700 hover:text-surface-300"
                  }`}
                >
                  {dirArrow(dir)}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Preset grid */}
      <div className="max-h-72 overflow-y-auto p-2.5 space-y-1.5 scroll-smooth">
        {filteredPresets.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-[10px] text-surface-500/80">No presets match &ldquo;{searchTerm}&rdquo;</p>
          </div>
        ) : (
          filteredPresets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            const isPlaced = templates.some((t) => t.label === preset.label);
            const dc = getDamageColor(preset.damageType);

            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`aoe-preset-card w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all ${
                  isSelected
                    ? "bg-accent-600/10 border-accent-500/30 shadow-sm"
                    : "bg-surface-800/40 border-transparent hover:bg-surface-800/60"
                }`}
                style={{
                  borderWidth: 1,
                  borderColor: isSelected ? "rgba(139,48,255,0.3)" : "transparent",
                }}
              >
                {/* Shape icon container with element color */}
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                  style={{ backgroundColor: dc.bg || `${preset.color}15` }}
                >
                  <ShapeIcon shape={preset.shape} />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-surface-200 truncate">{preset.label}</span>
                    {isPlaced && (
                      <span className="text-[8px] text-accent-400 shrink-0">✓</span>
                    )}
                  </div>
                  <p className="text-[9px] text-surface-500 mt-0.5 truncate leading-relaxed">{preset.description}</p>
                </div>

                {/* Badge: size + damage */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${preset.color}20`,
                      color: preset.color,
                    }}
                  >
                    {preset.size}ft
                  </span>
                  {preset.damageDice && (
                    <span
                      className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: dc.bg, color: dc.text, border: `1px solid ${dc.border}` }}
                    >
                      {damageIcon(preset.damageType)} {preset.damageDice}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Placed templates */}
      {templates.length > 0 && (
        <div className="border-t border-surface-700/40">
          <div className="px-3.5 py-1.5 bg-surface-800/40">
            <span className="text-[9px] font-semibold text-surface-500 uppercase tracking-widest">
              Placed ({placedCount})
            </span>
          </div>
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="group flex items-center gap-2.5 rounded-lg bg-surface-800/30 px-3 py-2 border border-transparent hover:border-surface-600/50 hover:bg-surface-800/50 transition-all"
              >
                {/* Color dot */}
                <div
                  className="h-2 w-2 rounded-full shrink-0 ring-1 ring-white/10"
                  style={{ backgroundColor: tpl.color ?? "#aa66ff" }}
                />

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-surface-200 truncate">{tpl.label}</span>
                    <span className="text-[8px] text-surface-500 font-mono">({tpl.gridX},{tpl.gridY})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[8px] text-surface-500">{tpl.size}ft {tpl.shape}</span>
                    {tpl.damageDice && (
                      <span className="text-[8px] text-surface-500">{tpl.damageDice}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-30 group-hover:opacity-100 transition-all shrink-0">
                  <button
                    onClick={() => onUpdateTemplate(tpl.id, { visibleToPlayers: !tpl.visibleToPlayers })}
                    className={`rounded p-1 text-[10px] transition-colors ${
                      tpl.visibleToPlayers
                        ? "text-accent-400 hover:text-accent-300"
                        : "text-surface-500 hover:text-surface-300"
                    }`}
                    title={tpl.visibleToPlayers ? "Visible to players" : "DM-only"}
                  >
                    {tpl.visibleToPlayers ? "👁" : "🙈"}
                  </button>
                  <button
                    onClick={() => {
                      const animOrder: AoETemplate["animation"][] = ["none", "pulse", "shimmer", "burn"];
                      const idx = animOrder.indexOf(tpl.animation ?? "none");
                      const next = animOrder[(idx + 1) % animOrder.length];
                      onUpdateTemplate(tpl.id, { animation: next });
                    }}
                    className="rounded p-1 text-[10px] text-surface-500 hover:text-surface-300 transition-colors"
                    title={`Animation: ${tpl.animation ?? "none"}`}
                  >
                    {tpl.animation === "none" ? "◌" : tpl.animation === "pulse" ? "◉" : tpl.animation === "shimmer" ? "✨" : "🔥"}
                  </button>
                  <button
                    onClick={() => handleDuplicate(tpl)}
                    className="rounded p-1 text-[10px] text-surface-500 hover:text-surface-300 transition-colors"
                    title="Duplicate"
                  >
                    📋
                  </button>
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

      {templates.length === 0 && (
        <div className="px-3.5 py-6 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface-800/60 border border-surface-700/30">
            <span className="text-sm opacity-50">✦</span>
          </div>
          <p className="text-[10px] text-surface-500/70">Click a preset to place a spell template.</p>
          <p className="mt-0.5 text-[8px] text-surface-600/50">Position it on the map after placing.</p>
        </div>
      )}
    </div>
  );
}
