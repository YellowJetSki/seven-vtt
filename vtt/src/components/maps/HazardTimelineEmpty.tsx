/* ── Hazard Timeline Empty State ───────────────────────────────
 * Fantasy-themed placeholder shown when no hazards or ground
 * effects are active. Animated pulsing arcane symbol.
 * ─────────────────────────────────────────────────────────────── */

export function HazardTimelineEmpty() {
  return (
    <div className="rounded-xl border border-surface-700/60 bg-surface-850/80 backdrop-blur-md overflow-hidden shadow-lg card-glow">
      <div className="flex items-center justify-between border-b border-surface-700/50 px-4 py-2.5 bg-gradient-to-r from-accent-900/10 to-transparent">
        <div className="flex items-center gap-2">
          <span className="text-sm">⏳</span>
          <span className="text-xs font-semibold text-surface-200 tracking-wide">Hazard Timeline</span>
        </div>
      </div>
      <div className="px-4 py-8 text-center">
        <div className="mx-auto mb-3 h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-br from-accent-900/20 to-mage-900/10 border border-accent-500/20 animate-pulse-soft">
          <span className="text-lg opacity-60">◈</span>
        </div>
        <p className="text-xs text-surface-500/80">No active hazards.</p>
        <p className="mt-1 text-[9px] text-surface-600/50 leading-relaxed max-w-[200px] mx-auto">
          Place an AoE spell template from the <span className="text-accent-400">preset panel</span> and click the map to position it as a persistent hazard zone.
        </p>
      </div>
    </div>
  );
}
