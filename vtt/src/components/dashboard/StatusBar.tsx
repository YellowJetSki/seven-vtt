/**
 * STᚱ VTT — Status Bar (Compact System Health)
 *
 * Minimal status indicators:
 * - Animated ping dots for active services
 * - Static dot for passive state (physical dice)
 * - Compact layout with version label right-aligned
 */

export default function StatusBar() {
  return (
    <div className="rounded-xl bg-gradient-to-b from-[#191b2b]/50 to-[#12131e]/60 border border-white/[0.03] px-4 sm:px-5 py-3 flex items-center gap-3 sm:gap-4 flex-wrap">
      {/* System Online */}
      <div className="flex items-center gap-2">
        <span className="relative flex w-2 h-2">
          <span className="animate-ping absolute inset-0 rounded-full bg-gold-500/40" />
          <span className="relative rounded-full w-2 h-2 bg-gold-500" />
        </span>
        <span className="text-[10px] sm:text-[11px] text-surface-400 font-medium">System Online</span>
      </div>

      <div className="h-4 w-px bg-white/[0.04] shrink-0" />

      {/* Local Storage */}
      <div className="flex items-center gap-2">
        <span className="relative flex w-2 h-2">
          <span className="animate-ping absolute inset-0 rounded-full bg-gold-500/40" style={{ animationDelay: '1s' }} />
          <span className="relative rounded-full w-2 h-2 bg-gold-500" />
        </span>
        <span className="text-[10px] sm:text-[11px] text-surface-400 font-medium">Local Storage</span>
      </div>

      <div className="h-4 w-px bg-white/[0.04] shrink-0" />

      {/* Physical Dice */}
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-gold-400/50" />
        <span className="text-[10px] sm:text-[11px] text-surface-500 font-medium">Physical Dice</span>
      </div>

      {/* Spacer */}
      <div className="flex-1 min-w-[4px]" />

      {/* Version */}
      <span className="text-[8px] text-surface-700 uppercase tracking-[0.15em] font-medium">Arkla v4.0</span>
    </div>
  );
}
