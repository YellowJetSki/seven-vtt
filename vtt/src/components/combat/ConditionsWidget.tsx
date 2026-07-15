/* ── Conditions & Environment Widget ────────────────────────────
 * Reusable widget for DM to set weather, lighting, and terrain
 * conditions. These values are synced to the combat store's
 * liveSession, which is pushed to Firestore and visible to players.
 *
 * ── Features ──────────────────────────────────────────────────
 * • Collapsible sections for compact/expanded view
 * • Hover tooltips on each option for mechanical descriptions
 * • Active condition indicator when non-default
 * • Responsive: wraps on mobile, horizontal on desktop
 * ─────────────────────────────────────────────────────────────── */

import { useCombatStore } from "@/stores/combatStore";
import {
  WEATHER_OPTIONS,
  LIGHTING_OPTIONS,
  TERRAIN_OPTIONS,
  type WeatherCondition,
  type LightingCondition,
  type TerrainCondition,
} from "@/types/combat";

interface ConditionsWidgetProps {
  /** Show all categories expanded by default */
  defaultExpanded?: boolean;
  /** Compact mode for sidebar/popover placement */
  compact?: boolean;
}

export function ConditionsWidget({
  defaultExpanded = false,
  compact = false,
}: ConditionsWidgetProps) {
  const conditions = useCombatStore((s) => s.liveSession.conditions);
  const setConditions = useCombatStore((s) => s.setConditions);

  const isDefault =
    conditions.weather === "clear" &&
    conditions.lighting === "bright" &&
    conditions.terrain === "normal";

  return (
    <div className={`rounded-xl border border-surface-700 bg-surface-850 p-4 ${compact ? "p-3" : "p-4"}`}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-surface-400">
          <span>🌤️</span>
          <span>Conditions</span>
        </h3>
        {!isDefault && (
          <span className="rounded-full bg-accent-500/10 px-2 py-0.5 text-[10px] font-medium text-accent-400">
            Active
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Weather */}
        <ConditionSelector
          label="Weather"
          options={WEATHER_OPTIONS}
          value={conditions.weather}
          onChange={(v) => setConditions({ weather: v as WeatherCondition })}
          compact={compact}
        />

        {/* Lighting */}
        <ConditionSelector
          label="Lighting"
          options={LIGHTING_OPTIONS}
          value={conditions.lighting}
          onChange={(v) => setConditions({ lighting: v as LightingCondition })}
          compact={compact}
        />

        {/* Terrain */}
        <ConditionSelector
          label="Terrain"
          options={TERRAIN_OPTIONS}
          value={conditions.terrain}
          onChange={(v) => setConditions({ terrain: v as TerrainCondition })}
          compact={compact}
        />
      </div>

      {/* Active Summary (when compact and non-default) */}
      {compact && !isDefault && (
        <div className="mt-3 space-y-1 border-t border-surface-700 pt-3">
          {conditions.weather !== "clear" && (
            <p className="text-[11px] text-surface-400">
              {WEATHER_OPTIONS.find((o) => o.value === conditions.weather)?.label}{" "}
              <span className="text-surface-500">
                — {WEATHER_OPTIONS.find((o) => o.value === conditions.weather)?.desc}
              </span>
            </p>
          )}
          {conditions.lighting !== "bright" && (
            <p className="text-[11px] text-surface-400">
              {LIGHTING_OPTIONS.find((o) => o.value === conditions.lighting)?.label}{" "}
              <span className="text-surface-500">
                — {LIGHTING_OPTIONS.find((o) => o.value === conditions.lighting)?.desc}
              </span>
            </p>
          )}
          {conditions.terrain !== "normal" && (
            <p className="text-[11px] text-surface-400">
              {TERRAIN_OPTIONS.find((o) => o.value === conditions.terrain)?.label}{" "}
              <span className="text-surface-500">
                — {TERRAIN_OPTIONS.find((o) => o.value === conditions.terrain)?.desc}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Sub-Component ──────────────────────────────────────────── */

interface ConditionSelectorProps {
  label: string;
  options: { value: string; label: string; desc: string }[];
  value: string;
  onChange: (value: string) => void;
  compact: boolean;
}

function ConditionSelector({
  label,
  options,
  value,
  onChange,
  compact,
}: ConditionSelectorProps) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-surface-500">
        {label}
      </p>
      <div className={`flex flex-wrap gap-1 ${compact ? "" : ""}`}>
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              title={opt.desc}
              className={`rounded-md px-2 py-1 text-[10px] font-medium transition-all ${
                isActive
                  ? "bg-accent-500/20 text-accent-300 ring-1 ring-accent-500"
                  : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-300"
              } ${compact ? "px-1.5 py-0.5 text-[9px]" : ""}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
