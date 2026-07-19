/**
 * STᚱ VTT — Status Bar (Premium Gold)
 *
 * System status bar with gold-accented indicators.
 */

export default function StatusBar() {
  return (
    <div className="premium-card-gold rounded-xl p-4 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="relative flex w-2.5 h-2.5">
          <span className="animate-ping absolute inset-0 rounded-full bg-gold-500/40" />
          <span className="relative rounded-full w-2.5 h-2.5 bg-gold-500" />
        </span>
        <span className="text-xs text-surface-400 font-medium">System Online</span>
      </div>

      <div className="h-5 w-px bg-gold-500/10" />

      <div className="flex items-center gap-2">
        <span className="relative flex w-2.5 h-2.5">
          <span className="animate-ping absolute inset-0 rounded-full bg-gold-500/40" style={{ animationDelay: "1s" }} />
          <span className="relative rounded-full w-2.5 h-2.5 bg-gold-500" />
        </span>
        <span className="text-xs text-surface-400 font-medium">Local Storage Active</span>
      </div>

      <div className="h-5 w-px bg-gold-500/10" />

      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-gold-400/60" />
        <span className="text-xs text-surface-500 font-medium">Physical Dice — No Digital RNG</span>
      </div>

      <div className="flex-1" />

      <span className="text-[10px] text-surface-600 uppercase tracking-widest">Arkla v4.0</span>
    </div>
  );
}
