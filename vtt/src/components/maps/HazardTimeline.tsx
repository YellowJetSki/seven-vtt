/* ── Hazard Timeline Panel ─────────────────────────────────────
 * Sidebar panel for MapEditor that lists all active HazardZones
 * with round countdowns, tick tracking, and quick controls.
 * Fantasy-styled with school-color gradients, glassmorphism,
 * staggered entry animations, and responsive layout.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import type { HazardZone, GroundEffect } from "@/types/hazard-zones";
import { HazardTimelineItem } from "./HazardTimelineItem";
import { HazardTimelineEmpty } from "./HazardTimelineEmpty";
import { HazardTimelineFooter } from "./HazardTimelineFooter";
import { GroundEffectsList } from "./GroundEffectsList";
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
  const urgentCount = hazards.filter((h) => h.remainingRounds !== null && h.remainingRounds <= 2).length;
  const concentrationCount = hazards.filter((h) => h.requiresConcentration).length;

  if (totalHazards === 0 && totalGroundEffects === 0) {
    return <HazardTimelineEmpty />;
  }

  return (
    <div className="rounded-xl border border-surface-700/60 bg-surface-850/80 backdrop-blur-md overflow-hidden shadow-lg card-glow">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-700/50 px-4 py-2.5 bg-gradient-to-r from-accent-900/10 to-transparent">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm shrink-0">⏳</span>
          <span className="text-xs font-semibold text-surface-200 tracking-wide truncate">Hazards</span>
          {totalHazards > 0 && <Badge variant="accent" size="sm" className="shrink-0">{totalHazards}</Badge>}
          {urgentCount > 0 && (
            <Badge size="sm"
              className="shrink-0 bg-warrior-500/20 text-warrior-400 border border-warrior-500/30 animate-rune-glow"
            >
              {urgentCount}
            </Badge>
          )}
        </div>
        <Button size="xs" variant="ghost" onClick={() => setCompact(!compact)} title="Toggle compact view">
          {compact ? "⊞" : "⊟"}
        </Button>
      </div>

      {/* Round indicator */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-700/30 bg-surface-800/40">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">Round</span>
            <span className="text-base font-bold font-mono text-accent-300 tabular-nums">{currentRound}</span>
          </div>
          {totalHazards > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-[8px] text-surface-600">
              <span>·</span>
              <span>{concentrationCount} conc.</span>
              <span>·</span>
              <span>{totalGroundEffects} residue</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="xs" variant="ghost" onClick={onProcessTicks}
            disabled={!hasActiveTicks}
            className={hasActiveTicks ? "text-accent-400 hover:text-accent-300" : ""}
          >
            <span className="mr-0.5">⚡</span> Tick
          </Button>
          <Button size="xs" onClick={onAdvanceRound}
            className="bg-accent-600/20 hover:bg-accent-600/40 text-accent-300 border border-accent-500/20"
          >
            <span className="mr-0.5">▶</span> Round
          </Button>
        </div>
      </div>

      {/* Hazard list */}
      {!compact && (
        <div className="max-h-80 overflow-y-auto overscroll-contain p-2 space-y-1.5 scroll-smooth" role="list">
          {sortedHazards.map((hazard, idx) => (
            <div key={hazard.id}
              style={{ animation: `scale-in 0.2s ease-out ${idx * 40}ms both` }}
            >
              <HazardTimelineItem
                hazard={hazard} currentRound={currentRound}
                onExpire={onExpireHazard} onExtend={onExtendHazard}
                onToggleVisibility={onToggleHazardVisibility}
                onSelect={setSelectedHazardId}
                isSelected={selectedHazardId === hazard.id}
              />
            </div>
          ))}
        </div>
      )}

      {/* Ground effects */}
      {!compact && <GroundEffectsList effects={groundEffects} />}

      {/* Footer summary */}
      {!compact && totalHazards > 0 && (
        <HazardTimelineFooter hazards={hazards} concentrationCount={concentrationCount} urgentCount={urgentCount} />
      )}
    </div>
  );
}
