/**
 * STᚱ VTT — Map Ping & Ruler Tools (Premium)
 *
 * Floating tool toggle bar for the DM battle map.
 * Provides quick access to Ping mode, Ruler/measurement tool, and
 * visual state overlay settings.
 *
 * Features:
 *   - Ping mode: Toggle to enable ping-on-click behavior (Alt+click shortcut)
 *   - Ruler mode: Toggle to enable click-and-drag distance measurement
 *   - Clear measurements: One-click to clear all persisted ruler lines
 *   - Active tool indicator: Gold highlight on the currently active tool
 *   - Keyboard shortcut hints: Shown as subtle tooltip text
 *   - Compact design: Single row, icon-only buttons with tooltip text
 *
 * Architecture:
 *   ┌──────────────────────────────────────────────────┐
 *   │  📍 Ping       📏 Measure      🗑 Clear Ruler   │
 *   └──────────────────────────────────────────────────┘
 *   Active: gold bg + border highlight
 *   Inactive: dim glass style
 *
 * Cycle 24 (Premium Battlemap Overhaul):
 *   - Ping tool for DM communication (expand ring animation)
 *   - Ruler tool for distance measurement (click-and-drag)
 *   - Persistent measurement clearing
 *   - Clean, minimal floating bar design
 */

interface MapPingRulerToolsProps {
  /** Whether ping mode is active */
  pingMode: boolean;
  /** Whether ruler mode is active */
  rulerMode: boolean;
  /** Whether there are measurements to clear */
  hasMeasurements: boolean;
  /** Toggle ping mode on/off */
  onTogglePing: () => void;
  /** Toggle ruler mode on/off */
  onToggleRuler: () => void;
  /** Clear all persisted measurements */
  onClearMeasurements: () => void;
}

export default function MapPingRulerTools({
  pingMode,
  rulerMode,
  hasMeasurements,
  onTogglePing,
  onToggleRuler,
  onClearMeasurements,
}: MapPingRulerToolsProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl" style={{
      background: "rgba(15, 16, 26, 0.85)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
    }}>
      {/* ── Ping toggle ── */}
      <button
        onClick={onTogglePing}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-150"
        style={{
          background: pingMode ? "rgba(234, 179, 8, 0.12)" : "transparent",
          color: pingMode ? "#eab308" : "#9ca3af",
          border: `1px solid ${pingMode ? "rgba(234, 179, 8, 0.25)" : "transparent"}`,
        }}
        title="Toggle ping mode (Alt+Click to ping)"
      >
        <span className="text-[11px]">📍</span>
        <span>Ping</span>
        {pingMode && (
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
        )}
      </button>

      {/* ── Vertical divider ── */}
      <div style={{
        width: "1px",
        height: "16px",
        background: "rgba(255, 255, 255, 0.06)",
        margin: "0 2px",
      }} />

      {/* ── Ruler toggle ── */}
      <button
        onClick={onToggleRuler}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-150"
        style={{
          background: rulerMode ? "rgba(234, 179, 8, 0.12)" : "transparent",
          color: rulerMode ? "#eab308" : "#9ca3af",
          border: `1px solid ${rulerMode ? "rgba(234, 179, 8, 0.25)" : "transparent"}`,
        }}
        title="Toggle ruler measurement tool (Click+drag to measure)"
      >
        <span className="text-[11px]">📏</span>
        <span>Measure</span>
        {rulerMode && (
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
        )}
      </button>

      {/* ── Clear measurements ── */}
      {hasMeasurements && (
        <button
          onClick={onClearMeasurements}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-150 hover:bg-white/[0.04]"
          style={{ color: "#6b7280" }}
          title="Clear all ruler measurements"
        >
          <span className="text-[11px]">🗑</span>
          <span>Clear</span>
        </button>
      )}
    </div>
  );
}
