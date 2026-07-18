/* ── Ground Effects List ───────────────────────────────────────
 * Collapsible sub-section within HazardTimeline showing
 * residual ground effects from expired hazard zones.
 * Each row shows a color dot, label, and remaining rounds.
 * ─────────────────────────────────────────────────────────────── */

import type { GroundEffect } from "@/types/hazard-zones";
import { Badge } from "@/components/ui/Badge";

interface Props {
  effects: GroundEffect[];
}

export function GroundEffectsList({ effects }: Props) {
  if (effects.length === 0) return null;

  return (
    <div className="border-t border-surface-700/40">
      <div className="px-4 py-1.5 bg-surface-800/40 flex items-center gap-2">
        <span className="text-[9px] font-semibold text-surface-500 uppercase tracking-widest">
          Residual Effects
        </span>
        <Badge variant="ghost" size="sm">{effects.length}</Badge>
      </div>
      <div className="max-h-28 overflow-y-auto overscroll-contain p-2 space-y-1">
        {effects.map((ge, idx) => (
          <div
            key={ge.id}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-surface-800/20 border border-surface-700/20 hover:bg-surface-800/40 transition-all"
            style={{ animation: `fade-in 0.2s ease-out ${idx * 60}ms both` }}
          >
            <div
              className="h-2 w-2 rounded-full shrink-0 animate-rune-glow"
              style={{
                backgroundColor: ge.color,
                boxShadow: `0 0 6px ${ge.color}44`,
              }}
            />
            <span className="text-[9px] text-surface-400 truncate flex-1 font-medium">{ge.label}</span>
            <span
              className={`text-[9px] font-mono shrink-0 ${
                ge.remainingRounds !== null && ge.remainingRounds <= 2
                  ? "text-warrior-400"
                  : "text-surface-500"
              }`}
            >
              {ge.remainingRounds !== null ? `${ge.remainingRounds}r` : "∞"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
