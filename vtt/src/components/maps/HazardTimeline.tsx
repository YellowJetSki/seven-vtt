/* ── Hazard Timeline Panel ─────────────────────────────────────
 * Sidebar panel for MapEditor that lists all active HazardZones
 * with round countdowns, tick tracking, and quick controls.
 * Powered by HazardTimelineItem for each row.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import type { HazardZone, GroundEffect } from "@/types/hazard-zones";
import { HazardTimelineItem } from "./HazardTimelineItem";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Props {
  hazards: HazardZone[];
  groundEffects: GroundEffect[];
  currentRound: number;
  onExpireHazard: (id: string) => void;
  onExtendHazard: (id: string, rounds: number) => void;
  onToggleHazardVisibility: (id: string) => void;
  onAdvanceRound: () => void;
  onProcessTicks: () => void;
}

export function HazardTimeline({
  hazards, groundEffects, currentRound,
  onExpireHazard, onExtendHazard, onToggleHazardVisibility,
  onAdvanceRound, onProcessTicks,
}: Props) {
  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);

  const sortedHazards = useMemo(
    () => [...hazards].sort((a, b) => (a.remainingRounds ?? 999) - (b.remainingRounds ?? 999)),
    [hazards],
  );

  const totalHazards = hazards.length;
  const totalGroundEffects = groundEffects.length;
  const hasActiveTicks = hazards.some((h) => h.tickDamage && (h.remainingRounds ?? 0) > 0);

  if (totalHazards === 0 && totalGroundEffects === 0) {
    return (
      <div className="rounded-xl border border-surface-700/60 bg-surface-850/80 backdrop-blur-md overflow-hidden shadow-lg">
        <div className="flex items-center justify-between border-b border-surface-700/50 px-3.5 py-2.5 bg-gradient-to-r from-accent-900/10 to-transparent">
          <div className="flex items-center gap-2">
            <span className="text-sm">⏳</span>
            <span className="text-xs font-semibold text-surface-200 tracking-wide">Hazard Timeline</span>
          </div>
        </div>
        <div className="px-3.5 py-6 text-center">
          <div className="mx-auto mb-2 h-10 w-10 flex items-center justify-center rounded-full bg-surface-800/60 border border-surface-700/30">
            <span className="text-sm opacity-50">⏳</span>
          </div>
          <p className="text-[10px] text-surface-500/70">No active hazards.</p>
          <p className="mt-0.5 text-[8px] text-surface-600/50">Place spell templates to see them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-700/60 bg-surface-850/80 backdrop-blur-md overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-700/50 px-3.5 py-2.5 bg-gradient-to-r from-accent-900/10 to-transparent">
        <div className="flex items-center gap-2">
          <span className="text-sm">⏳</span>
          <span className="text-xs font-semibold text-surface-200 tracking-wide">Hazards</span>
          {totalHazards > 0 && <Badge variant="accent" size="sm">{totalHazards}</Badge>}
          {totalGroundEffects > 0 && <Badge variant="ghost" size="sm">{totalGroundEffects} residue</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Button size="xs" variant="ghost" onClick={() => setCompact(!compact)} title="Toggle compact">
            {compact ? "⊞" : "⊟"}
          </Button>
        </div>
      </div>

      {/* Round indicator + controls */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-surface-700/30 bg-surface-800/40">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-surface-500 uppercase tracking-wider">Round</span>
          <span className="text-sm font-bold font-mono text-accent-300">{currentRound}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="xs"
            variant="ghost"
            onClick={onProcessTicks}
            disabled={!hasActiveTicks}
            title="Process damage ticks"
          >
            ⚡ Tick
          </Button>
          <Button size="xs" onClick={onAdvanceRound} title="Advance to next round">
            ▶ Round
          </Button>
        </div>
      </div>

      {/* Hazard list */}
      {!compact && (
        <div className="max-h-80 overflow-y-auto p-2 space-y-1.5 scroll-smooth">
          {sortedHazards.map((hazard) => (
            <HazardTimelineItem
              key={hazard.id}
              hazard={hazard}
              currentRound={currentRound}
              onExpire={onExpireHazard}
              onExtend={onExtendHazard}
              onToggleVisibility={onToggleHazardVisibility}
              onSelect={setSelectedHazardId}
              isSelected={selectedHazardId === hazard.id}
            />
          ))}
        </div>
      )}

      {/* Ground effects list */}
      {groundEffects.length > 0 && !compact && (
        <div className="border-t border-surface-700/40">
          <div className="px-3.5 py-1.5 bg-surface-800/40">
            <span className="text-[9px] font-semibold text-surface-500 uppercase tracking-widest">
              Residual Effects ({groundEffects.length})
            </span>
          </div>
          <div className="max-h-32 overflow-y-auto p-2 space-y-0.5">
            {groundEffects.map((ge) => (
              <div key={ge.id} className="flex items-center gap-2 rounded px-2 py-1 bg-surface-800/20">
                <div
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: ge.color }}
                />
                <span className="text-[9px] text-surface-400 truncate flex-1">{ge.label}</span>
                <span className="text-[8px] font-mono text-surface-500">
                  {ge.remainingRounds !== null ? `${ge.remainingRounds}r` : "∞"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary footer */}
      {!compact && totalHazards > 0 && (
        <div className="border-t border-surface-700/40 px-3.5 py-1.5 bg-surface-800/30">
          <div className="flex justify-between text-[8px] text-surface-600">
            <span>Concentration: {hazards.filter((h) => h.requiresConcentration).length}</span>
            <span>Altitude: GND {hazards.filter((h) => h.altitude === "ground").length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
