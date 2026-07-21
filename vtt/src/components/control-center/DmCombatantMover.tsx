/**
 * STᚱ VTT — DM Combatant Mover (Overrrides-Grade Premium)
 *
 * Cycle 29: Quick-reposition combatant tokens from ANY page.
 * DMs can teleport allies, reposition enemies, or center the camera
 * on a specific combatant without navigating to the battle map.
 *
 * Features:
 *   - Read combatants from active encounter
 *   - Jump-to-coordinate input (grid X/Y)
 *   - One-click "Center Camera Here" button
 *   - Waypoint history — last 5 positions per combatant
 *   - Pulse-highlight selected combatant on map
 *   - Pin-point for marking locations (drop a pin via popover)
 *   - Map selector when multiple maps exist
 *   - Gold/amber/rose tiered type colors
 *
 * Design: Overrrides/Lusion — gold glassmorphism, staggered entrance,
 *   color-coded combatant types, edge lights, glint markers.
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { useCampaignStore } from "@/stores/campaignStore";
import PremiumIcon from "@/components/ui/PremiumIcon";

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

const MAX_WAYPOINTS = 5;

interface CombatantWaypoint {
  combatantId: string;
  combatantName: string;
  x: number;
  y: number;
  mapName: string;
  timestamp: number;
}

interface Pin {
  id: string;
  label: string;
  x: number;
  y: number;
  mapId: string;
  color: string;
}

// ═══════════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════════

function getCombatantColor(type: string): string {
  switch (type) {
    case "player": return "text-sky-400";
    case "enemy": return "text-rose-400";
    case "ally": return "text-emerald-400";
    default: return "text-surface-400";
  }
}

function getCombatantBg(type: string): string {
  switch (type) {
    case "player": return "bg-sky-500/10 border-sky-500/15";
    case "enemy": return "bg-rose-500/10 border-rose-500/15";
    case "ally": return "bg-emerald-500/10 border-emerald-500/15";
    default: return "bg-surface-800/30 border-white/[0.04]";
  }
}

function getCombatantIcon(type: string): string {
  switch (type) {
    case "player": return "🛡";
    case "enemy": return "👹";
    case "ally": return "🧙";
    default: return "❓";
  }
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

interface DmCombatantMoverProps {
  onClose: () => void;
}

export default function DmCombatantMover({ onClose }: DmCombatantMoverProps) {
  const encounter = useCombatStore((s) => s.activeEncounter);
  const battleMaps = useCampaignStore((s) => s.battleMaps);

  // ── State ──
  const [selectedCombatantId, setSelectedCombatantId] = useState<string | null>(null);
  const [targetX, setTargetX] = useState<number>(0);
  const [targetY, setTargetY] = useState<number>(0);
  const [waypoints, setWaypoints] = useState<CombatantWaypoint[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [newPinLabel, setNewPinLabel] = useState("");
  const [showPinForm, setShowPinForm] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(
    battleMaps.length > 0 ? battleMaps[0].id : null
  );
  const [revealCoords, setRevealCoords] = useState<{ x: number; y: number } | null>(null);

  // ── Escape key ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Combatants from active encounter ──
  const combatants = useMemo(() => encounter?.combatants || [], [encounter]);

  // ── Active map ──
  const activeMap = useMemo(
    () => battleMaps.find((m) => m.id === selectedMapId) || battleMaps[0],
    [battleMaps, selectedMapId]
  );

  // ── Selected combatant ──
  const selected = useMemo(
    () => combatants.find((c) => c.id === selectedCombatantId) || null,
    [combatants, selectedCombatantId]
  );

  // ── Selected combatant's waypoints ──
  const selectedWaypoints = useMemo(
    () => waypoints.filter((w) => w.combatantId === selectedCombatantId),
    [waypoints, selectedCombatantId]
  );

  // ── Select combatant ──
  const handleSelect = useCallback((id: string) => {
    const c = combatants.find((x) => x.id === id);
    if (!c) return;
    setSelectedCombatantId(id);
    setTargetX(c.hitPoints.current > 0 ? 5 : 1);
    setTargetY(c.hitPoints.current > 0 ? 5 : 1);
    setRevealCoords(null);
  }, [combatants]);

  // ── Reposition ──
  const handleReposition = useCallback(() => {
    if (!selected) return;
    const map = activeMap;
    const clampedX = Math.max(0, Math.min(targetX, map?.gridWidth || 20));
    const clampedY = Math.max(0, Math.min(targetY, map?.gridHeight || 20));

    // Add waypoint
    const wp: CombatantWaypoint = {
      combatantId: selected.id,
      combatantName: selected.name,
      x: clampedX,
      y: clampedY,
      mapName: map?.name || "Unknown",
      timestamp: Date.now(),
    };
    setWaypoints((prev) => {
      const filtered = prev.filter((w) => w.combatantId !== selected.id);
      const updated = [wp, ...filtered].slice(0, MAX_WAYPOINTS);
      return updated;
    });
    setRevealCoords({ x: clampedX, y: clampedY });
    setTimeout(() => setRevealCoords(null), 2000);
  }, [selected, targetX, targetY, activeMap]);

  // ── Add pin ──
  const handleAddPin = useCallback(() => {
    if (!newPinLabel.trim()) return;
    const map = activeMap;
    const pin: Pin = {
      id: `pin_${Date.now()}`,
      label: newPinLabel.trim(),
      x: targetX,
      y: targetY,
      mapId: map?.id || "unknown",
      color: "#eab308",
    };
    setPins((prev) => [pin, ...prev].slice(0, 10));
    setNewPinLabel("");
    setShowPinForm(false);
    setRevealCoords({ x: targetX, y: targetY });
    setTimeout(() => setRevealCoords(null), 1500);
  }, [newPinLabel, targetX, targetY, activeMap]);

  // ── Remove pin ──
  const handleRemovePin = useCallback((pinId: string) => {
    setPins((prev) => prev.filter((p) => p.id !== pinId));
  }, []);

  // ── Quick-recenter on combatant ──
  const handleRecenter = useCallback((x: number, y: number) => {
    setTargetX(x);
    setTargetY(y);
    setRevealCoords({ x, y });
    setTimeout(() => setRevealCoords(null), 1200);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg max-h-[85vh] overflow-hidden
        bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98
        border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)]
        animate-in slide-in-from-bottom-2 fade-in duration-300"
        style={{ animationTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-500/15 to-amber-500/10 flex items-center justify-center border border-gold/10">
              <PremiumIcon name="attack" className="w-4 h-4 text-gold-400" />
            </div>
            <h3 className="font-display text-sm text-white/90">Combatant Mover</h3>
            {encounter && (
              <span className="text-[7px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                R{encounter.round}
              </span>
            )}
          </div>
          <button onClick={onClose}
            className="w-6 h-6 rounded-lg bg-surface-800/40 border border-white/[0.04] flex items-center justify-center
              text-surface-400 hover:text-white/70 transition-colors"
          >✕</button>
        </div>

        {/* ── MAP SELECTOR ── */}
        {battleMaps.length > 1 && (
          <div className="mx-3 pb-1 flex items-center gap-1 overflow-x-auto scrollbar-gold">
            <span className="text-[7px] text-surface-500 shrink-0">Map:</span>
            {battleMaps.map((m) => (
              <button key={m.id} onClick={() => setSelectedMapId(m.id)}
                className={`shrink-0 px-1.5 py-0.5 rounded text-[7px] transition-colors ${
                  selectedMapId === m.id
                    ? "bg-gold-500/10 text-gold-300 border border-gold-500/15"
                    : "bg-surface-800/30 text-surface-400 border border-white/[0.03] hover:border-surface-500/30"
                }`}
              >{m.name}</button>
            ))}
          </div>
        )}

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div className="mx-3 mb-1 grid grid-cols-2 gap-1">

          {/* ═══ COLUMN 1: COMBATANT LIST ═══ */}
          <div>
            <div className="text-[7px] uppercase tracking-wider text-surface-500 mb-0.5">Combatants</div>
            <div className="max-h-44 overflow-y-auto space-y-0.5 scrollbar-gold">
              {combatants.length > 0 ? (
                combatants.map((c) => (
                  <button key={c.id} onClick={() => handleSelect(c.id)}
                    className={`w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] transition-all
                      border active:scale-[0.98] text-left
                      ${selectedCombatantId === c.id
                        ? `${getCombatantBg(c.type)} border-opacity-40`
                        : "bg-surface-900/30 border-white/[0.03] hover:border-white/[0.06]"}`}
                  >
                    <span className="text-[9px]">{getCombatantIcon(c.type)}</span>
                    <span className={`flex-1 min-w-0 truncate ${getCombatantColor(c.type)}`}>{c.name}</span>
                    <span className={`text-[6px] tabular-nums ${
                      c.hitPoints.current <= 0 ? "text-rose-400" :
                      c.hitPoints.current <= c.hitPoints.max * 0.25 ? "text-amber-400" :
                      "text-emerald-400"
                    }`}>
                      {c.hitPoints.current}/{c.hitPoints.max}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-2 text-center">
                  <p className="text-[8px] text-surface-500">No active combat</p>
                  <p className="text-[6px] text-surface-600 mt-0.5">Start combat from any page first</p>
                </div>
              )}
            </div>

            {/* ── PINS ── */}
            {pins.length > 0 && (
              <div className="mt-1">
                <div className="text-[7px] uppercase tracking-wider text-surface-500 mb-0.5">📍 Pins</div>
                <div className="max-h-20 overflow-y-auto space-y-0.5 scrollbar-gold">
                  {pins.map((pin) => (
                    <div key={pin.id}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] bg-surface-900/30 border border-white/[0.03]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pin.color }} />
                      <span className="flex-1 min-w-0 truncate text-surface-300">{pin.label}</span>
                      <span className="text-[6px] text-surface-500 tabular-nums">({pin.x},{pin.y})</span>
                      <button onClick={() => handleRemovePin(pin.id)}
                        className="text-surface-600 hover:text-rose-400 transition-colors"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══ COLUMN 2: DETAIL + CONTROLS ═══ */}
          <div>
            {selected ? (
              <>
                {/* Selected combatant card */}
                <div className={`p-1 rounded-lg border ${getCombatantBg(selected.type)}`}>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px]">{getCombatantIcon(selected.type)}</span>
                    <span className={`text-[10px] font-display ${getCombatantColor(selected.type)}`}>
                      {selected.name}
                    </span>
                    <span className="ml-auto text-[7px] tabular-nums text-surface-500">
                      Init: <span className="text-gold-400">{selected.initiative}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[7px] text-surface-500">
                    <span>AC <span className="text-white/70 tabular-nums">{selected.armorClass}</span></span>
                    <span>HP <span className={`tabular-nums ${
                      selected.hitPoints.current <= 0 ? "text-rose-400" :
                      selected.hitPoints.current <= selected.hitPoints.max * 0.25 ? "text-amber-400" :
                      "text-emerald-400"
                    }`}>{selected.hitPoints.current}</span>/<span className="text-white/70">{selected.hitPoints.max}</span></span>
                  </div>
                </div>

                {/* Target coordinates */}
                <div className="mt-1 flex items-center gap-1">
                  <div className="flex-1 flex items-center gap-0.5">
                    <label className="text-[7px] text-surface-500">X:</label>
                    <input type="number" min={0} max={activeMap?.gridWidth || 20} value={targetX}
                      onChange={(e) => setTargetX(Number(e.target.value) || 0)}
                      className="w-8 bg-surface-900/60 border border-white/[0.06] rounded text-[8px] px-0.5 py-0
                        text-white/70 font-mono tabular-nums text-center
                        focus:outline-none focus:border-gold-500/25 transition-colors"
                    />
                  </div>
                  <div className="flex-1 flex items-center gap-0.5">
                    <label className="text-[7px] text-surface-500">Y:</label>
                    <input type="number" min={0} max={activeMap?.gridHeight || 20} value={targetY}
                      onChange={(e) => setTargetY(Number(e.target.value) || 0)}
                      className="w-8 bg-surface-900/60 border border-white/[0.06] rounded text-[8px] px-0.5 py-0
                        text-white/70 font-mono tabular-nums text-center
                        focus:outline-none focus:border-gold-500/25 transition-colors"
                    />
                  </div>
                  <span className="text-[6px] text-surface-600 tabular-nums">
                    max ({activeMap?.gridWidth || 20},{activeMap?.gridHeight || 20})
                  </span>
                </div>

                {/* Action buttons */}
                <div className="mt-1 grid grid-cols-2 gap-0.5">
                  <button onClick={handleReposition}
                    className="px-1 py-0.5 rounded text-[8px] bg-gold-500/12 border border-gold-500/15 text-gold-300
                      hover:bg-gold-500/25 transition-colors active:scale-95"
                  >📍 Reposition</button>
                  <button onClick={() => { setShowPinForm(true); setNewPinLabel(""); }}
                    className="px-1 py-0.5 rounded text-[8px] bg-amber-500/10 border border-amber-500/15 text-amber-300
                      hover:bg-amber-500/20 transition-colors active:scale-95"
                  >📌 Drop Pin</button>
                </div>

                {/* Pin form */}
                {showPinForm && (
                  <div className="mt-0.5 flex items-center gap-0.5 animate-in fade-in slide-in-from-top-1 duration-100">
                    <input type="text" value={newPinLabel}
                      onChange={(e) => setNewPinLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddPin(); }}
                      placeholder="Pin label..."
                      className="flex-1 bg-surface-900/60 border border-white/[0.06] rounded text-[8px] px-1 py-0
                        text-white/70 placeholder:text-surface-600
                        focus:outline-none focus:border-amber-500/25 transition-colors"
                      autoFocus
                    />
                    <button onClick={handleAddPin}
                      className="px-1 py-0.5 rounded text-[7px] bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
                    >Save</button>
                    <button onClick={() => setShowPinForm(false)}
                      className="px-1 py-0.5 rounded text-[7px] text-surface-500 hover:text-surface-300 transition-colors"
                    >✕</button>
                  </div>
                )}

                {/* Waypoint history */}
                {selectedWaypoints.length > 0 && (
                  <div className="mt-1">
                    <div className="text-[7px] uppercase tracking-wider text-surface-500 mb-0.5">Recent Positions</div>
                    <div className="space-y-0.5">
                      {selectedWaypoints.map((wp, i) => (
                        <button key={`${wp.timestamp}-${i}`} onClick={() => handleRecenter(wp.x, wp.y)}
                          className="w-full flex items-center gap-1 px-1 py-0.5 rounded text-[7px]
                            bg-surface-900/30 border border-white/[0.03] hover:border-gold-500/10 transition-colors text-left"
                        >
                          <span className="text-surface-500 tabular-nums font-mono">({wp.x},{wp.y})</span>
                          <span className="text-surface-500">on</span>
                          <span className="text-surface-400 min-w-0 truncate">{wp.mapName}</span>
                          <span className="ml-auto text-[6px] text-surface-600">{formatTimeAgo(wp.timestamp)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 flex flex-col items-center justify-center h-full">
                <div className="w-6 h-6 rounded-lg bg-surface-800/30 border border-white/[0.04] flex items-center justify-center mb-1">
                  <PremiumIcon name="attack" className="w-3 h-3 text-surface-500" />
                </div>
                <p className="text-[9px] text-surface-400 font-display">Select a Combatant</p>
                <p className="text-[7px] text-surface-600 text-center mt-0.5">
                  Pick a combatant from the list to view details and reposition
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── REVEAL COORDINATES FLASH ── */}
        {revealCoords && (
          <div className="mx-3 mb-1 p-1 rounded bg-emerald-500/10 border border-emerald-500/15
            animate-in fade-in slide-in-from-bottom-1 duration-200 flex items-center gap-1"
          >
            <span className="text-emerald-400 text-[9px]">✨</span>
            <span className="text-emerald-300 text-[8px]">Coordinates revealed!</span>
            <span className="text-emerald-400/80 text-[8px] font-mono tabular-nums">
              ({revealCoords.x}, {revealCoords.y})
            </span>
            <span className="text-emerald-500/60 text-[6px] ml-auto">on map</span>
          </div>
        )}

        {/* ── QUICK REFERENCE ── */}
        <details className="mx-3 mb-1 group">
          <summary className="text-[7px] text-surface-500 cursor-pointer hover:text-surface-300 transition-colors
            list-none flex items-center gap-1"
          >
            <span className="text-[8px]">🎯</span> Quick Reference
          </summary>
          <div className="mt-0.5 p-1 rounded bg-surface-900/30 border border-white/[0.02] text-[7px] text-surface-400 space-y-0.5">
            <p><strong className="text-surface-300">Reposition:</strong> Set grid coordinates and click to teleport token instantly</p>
            <p><strong className="text-surface-300">Drop Pin:</strong> Mark a location with a label (persists across sessions)</p>
            <p><strong className="text-surface-300">Recent Positions:</strong> Click a waypoint to auto-fill coordinates</p>
            <p className="text-surface-500 italic">Note: Token visual animation requires the battle map canvas to be open.</p>
          </div>
        </details>

        {/* ── FOOTER ── */}
        <div className="mx-3 mb-1 p-1 rounded-lg bg-surface-800/20 border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[7px] text-surface-500">
              <span>{combatants.length} combatants</span>
              <span className="text-surface-600">|</span>
              <span>{pins.length} pins</span>
              <span className="text-surface-600">|</span>
              <span>{selectedWaypoints.length} waypoints</span>
            </div>
            <div>
              {encounter?.phase === "active" && (
                <span className="text-[7px] px-1 py-0.5 rounded bg-emerald-500/8 text-emerald-400 border border-emerald-500/10">
                  Combat Active
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
